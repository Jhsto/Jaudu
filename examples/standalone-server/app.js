
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , jaudu = require('jaudu')
  , http = require('http')
  , path = require('path');

// Connect to redis stack
jaudu.Database("nodejitsudb8570198223.redis.irstack.com", "f327cfe980c971946e80b8e975fbebb4", 6379);

var app = express();
var server = http.createServer(app);

app.configure(function(){
  app.set('port', process.env.PORT || 3003);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(jaudu);
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

app.post('/retrieve', function(req, res){

  // See the CSRF tokens printed
  console.log(req.body);

  res.send(200, 'OK')

});

server.listen(3003);