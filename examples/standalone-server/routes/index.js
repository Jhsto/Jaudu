
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index.jade', { title: 'Login page' });
};