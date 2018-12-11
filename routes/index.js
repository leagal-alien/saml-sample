var express = require('express');
var router = express.Router();
var request = require('request');

// ログアウト状態かを判別できるようにする
/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});
//router.get('/', function(req, res, next) {
router.all('/', function(req, res, next) {
  console.log("DEBUG req. headers" , req.headers);
  var url = req.headers['x-cf-forwarded-url'];
  console.log("DEBUG x-cf-forwarded-url , ", url);
  console.log("DEBUG x-cf-proxy-signature, ", req.headers['x-cf-proxy-signature']);
  console.log("DEBUG x-cf-proxy-metadata, ", req.headers['x-cf-proxy-metadata']);
  console.log("DEBUG req.cookies, ", req.cookies);
  if (req.user) {
    console.log(req.user);
    //res.render('index', { title: 'Express(Already logged in)' + req.user.nameID});
    req.pipe(request(url)).pipe(res);
  } else {
    //res.render('index', { title: 'Express' });
    res.redirect(process.env.CLIENT_LOGIN_URL);
  }
});

module.exports = router;
