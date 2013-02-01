
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , crypto = require('crypto')
  , secretSeed = 0
  , hash = require('../node_modules/node_hash/lib/hash')
  , io = require('socket.io')
  , redis = require("redis")
  , client;

var Database = function(host, password, port) {
  client = redis.createClient(port, host);
  client.auth(host + ':' + password, function() {
    console.log("Jaudu established connection to database.");
  });
};

var app = express();
var server = http.createServer(app);
var io = io.listen(server);

io.configure(function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);
  io.set('transports', [
    'websocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
  ]);
});

io.configure(function (){
  io.set('authorization', function (handshakeData, callback) {
    var hostIP = handshakeData.headers.host;
    var clientIP = null;
    if(handshakeData.headers['x-forwarded-for']){
        clientIP = handshakeData.headers['x-forwarded-for'];
    }
    if (clientIP === undefined) {
      console.log('Error determining clientIP');
    }
    handshakeData.clientIP = clientIP;
    callback(null, true); // error first callback style
  });

});

server.listen(3012);

io.sockets.on('connection', function (socket) {

  var clientIP = socket.handshake.clientIP;

  socket.on('ban', function (data) {

    client.exists(clientIP + hostIP + '_ipban', function (err, reply) {

      if (err) throw err;

      if (reply === 1) {

        client.get(clientIP + hostIP + '_ipban', function (err, attempts) { 

          if (err) throw err;

          var atte = parseInt(attempts);

          if (atte++ <= parseInt(data.treshold)) {

            client.ttl(clientIP + hostIP + '_ipban', function (err, ttl) {

              if (err) throw err;

              client.setex(clientIP + hostIP + '_ipban', ttl, atte++);

              io.sockets.socket(socket.id).emit('ipban', { wait: 'OK' });

            }); 


          }

          else {

            client.ttl(clientIP + hostIP + '_ipban', function (err, ttl) {

              if (err) throw err;

              io.sockets.socket(socket.id).emit('ipban', { wait: ttl });

            });

          }

        });

      }

      else {

        client.setex(clientIP + hostIP + '_ipban', data.during, 1);

        io.sockets.socket(socket.id).emit('ipban', { wait: 'OK' });

      }

    });

  });

  socket.on('timelock', function (data) {

        client.exists(clientIP + hostIP + '_quota', function (err, reply) {       

          if (err) throw err;

          if (reply === 1) {

            client.ttl(clientIP + hostIP + '_quota', function (err, ttl) {

              if (err) throw err;

              if (typeof ttl !== 'number') {
                ttl = 1;
              }

              if (ttl.lenght > 5) {
                ttl = 99999;
              }

              io.sockets.socket(socket.id).emit('abort', { wait: ttl });

            });
          }

          else {

            io.sockets.socket(socket.id).emit('abort', { wait: 'OK' });

            client.setex(clientIP + hostIP + '_quota', data.wait, hostIP);
          }

        });

  });


  socket.on('decryption', function () {

    try {
      var buf = crypto.randomBytes(256);
      var saltBuf = buf.toString();
      } catch (ex) {
        socket.disconnect();
    }

    secretSeed++;

    var secret = hash.sha512(secretSeed.toString(), saltBuf);
    var data = '<input type="hidden" id="jaudu_secret" value="' + secret + '" name="jaudu_secret" required="required"><input type="hidden" id="jaudu_public" name="jaudu_public" required="required" value="">';
    var algorithm = 'aes-256-cbc';
    var key = '|4ec.kI&Gz>ni1A<oTKdo2VX)*Tn[Ah|X|!=KFYUV:%6qK4\Gj(w/YHi<(yTVC4';
    var clearEncoding = 'utf8';
    var cipherEncoding = 'hex';
    var cipher = crypto.createCipher(algorithm, key);
    var cipherChunks = [];
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    var decipher = crypto.createDecipher(algorithm, key);
    var plainChunks = [];
    for (var i = 0;i < cipherChunks.length;i++) {
      plainChunks.push(decipher.update(cipherChunks[i], cipherEncoding, clearEncoding));
    }
    plainChunks.push(decipher.final(clearEncoding));
    var crypted = hash.sha512(cipherChunks.join(''), saltBuf);
    var decrypted = plainChunks.join('');

    client.mset(secret + '_key', crypted, secret + '_salt', saltBuf);

    io.sockets.socket(socket.id).emit('keys', { public: crypted, secret: decrypted });

    socket.on('disconnect', function () {
      client.expire(secret + '_salt', 5);
      client.expire(secret + '_key', 5);
    });

  });

});

var compare = function (req, res, next) {

   if ('POST' !== req.method) return next();

    var secret_k = req.body.jaudu_secret;
    var public_k = req.body.jaudu_public;

    if (secret_k === undefined || public_k === undefined) {

      res.end('CSRF tokens could not be redeemed. Please make sure you have JavaScript enabled.');

    }

        client.get(secret_k + '_key', function (err, replyKey) {

          if (err) throw err;

            if (replyKey === public_k) {

              client.get(secret_k + '_salt', function (err, replySalt) {

                if (replySalt === null) {
                  res.end('CSRF tokens send were expired.');
                  return;
                }

                if (err) throw err;

                var data = '<input type="hidden" id="jaudu_secret" value="' + secret_k + '" name="jaudu_secret" required="required"><input type="hidden" id="jaudu_public" name="jaudu_public" required="required" value="">';
                var algorithm = 'aes-256-cbc';
                var key = '|4ec.kI&Gz>ni1A<oTKdo2VX)*Tn[Ah|X|!=KFYUV:%6qK4\Gj(w/YHi<(yTVC4';
                var clearEncoding = 'utf8';
                var cipherEncoding = 'hex';
                var cipher = crypto.createCipher(algorithm, key);
                var cipherChunks = [];
                cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
                cipherChunks.push(cipher.final(cipherEncoding));
                var crypted = hash.sha512(cipherChunks.join(''), replySalt);

                if (crypted === public_k) {
                  next();
                }
                else {
                  res.end('CSRF token comparison failed.');
                }

              });

            }

            else {

              res.end('CSRF token verification failed.');

            }
        
          client.del(secret_k + '_salt');
          client.del(secret_k + '_key');    

        });

};

module.exports = compare;
module.exports.Database = Database;