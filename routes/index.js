const express = require('express');
const router = express.Router();
const User = require('../models/user');

//Setting Layout Variables
router.use((req, res, next) => {
  res.locals.title = 'TutorMont';
  res.locals.currentUserId = req.session.userId;


  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'TutorMont' });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});

//Login Create
router.post('/login', (req, res, next) => {
  User.authenticate(req.body.email,
  req.body.password, (err, user) => {
    if (err || !user) {
      console.log(err)
      const next_error = new Error("Username or password incorrect");
      next_error.status = 401;
      return next(next_error);
    }
    // if (!user.isVerified) {
    //   const verification_error = new Error('Your Account is not yet verified. A verification email should have been sent to the email address you provided at signup');
    //   verification_error.status = 401;
    //   return next(verification_error);
    // }
    else {
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

router.get('/privacy-policy', function(req, res, next) {
  res.render('privacy-policy');
});


module.exports = router;
