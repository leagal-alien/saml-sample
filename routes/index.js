var express = require('express');
var router = express.Router();


// ログアウト状態かを判別できるようにする
/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});
router.get('/', function(req, res, next) {
  if (req.user) {
    console.log(req.user);
    res.render('index', { title: 'Express(Already logged in)' + req.user.nameID});
  } else {
    res.render('index', { title: 'Express' });
  }
});

module.exports = router;
