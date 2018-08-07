const express = require('express');
const router = express.Router();
const User = require('../models/user');

//Setting Layout Variables
router.use((req, res, next) => {
  res.locals.title = 'HermesTutor';
  res.locals.currentUserId = req.session.userId;
  

  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'HermesTutor' });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

//Login Create
router.post('/login', (req, res, next) => {
  User.authenticate(req.body.username,
  req.body.password, (err, user) => {
    if (err || !user) {
      console.log(err)
      const next_error = new Error("Username or password incorrect");
      next_error.status = 401;

      return next(next_error);
    } else {
      req.session.userId =  user._id;

      return res.redirect('/');
    }
  });
});

router.get('/logout', (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) return next(err);
    });
  }
  return res.redirect('/');
});



module.exports = router;