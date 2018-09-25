const express = require('express');
//const router = express.Router();
const router = express.Router({mergeParams: true});
const Review = require('../models/review');
const auth = require('./helpers/auth');
const User = require('../models/user');
const users = require('./users');


//Review new
router.get('/new', auth.requireLogin, (req, res, next) => {
    res.render('reviews/new', { userId: req.params.userId });
});

//review create
router.post('/', auth.requireLogin, (req, res, next) => {
    let review = new Review(req.body);
    review.tutorId = req.params.userId

    review.save(function(err, review) {
      if(err) { console.error(err) };

      return res.redirect( `reviews`);
    });
  });

// review show
  router.get('/', auth.requireLogin, (req, res, next) => {
    Review.find({ tutorId: req.params.userId },  (err, reviews) => {
    if (err) { console.error(err) };
    res.render('reviews/show', { reviews: reviews });
  }).sort({ createdAt: -1 });
  });

// router.get('/', auth.requireLogin, (req, res, next) => {
//   Review.find({ tutorId: req.params.userId },  (err, reviews) => {
//   if (err) { console.error(err) };
//   User.find({ tutorId: req.params.userId }, (err, user) =>{
//     if (err) { console.error(err) };
//   })
//   res.render('reviews/show', { user: user, reviews: reviews });
// }).sort({ createdAt: -1 });
// })

// router.get('/', auth.requireLogin, (req, res, next) => {
//   User.findById({ tutorId: req.params.userId }, (err, user)  => {
//     if (err) { console.error(err) };
//     Review.find({ tutorId: req.params.userId },  (err, reviews) => {
//     if (err) { console.error(err) };
//     res.render('reviews/show', { user: user, reviews: reviews });
//   }).sort({ createdAt: -1 });
//   })
// })
module.exports = router;
