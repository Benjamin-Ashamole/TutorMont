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

//Review create
router.post('/', auth.requireLogin, (req, res, next) => {
    let review = new Review(req.body);
    review.tutorId = req.params.userId;

    review.save(function(err, review) {
      if(err) { console.error(err) };

      return res.redirect( `reviews`);
    });
  });

  router.get('/', auth.requireLogin, (req, res, next) => {
    Review.find( { tutorId: req.params.userId }, (err, reviews) =>{
      if (reviews.length !== 0) {
        let review = reviews[0].tutorId
        User.findById( {_id: review }, (err, user) => {
          //console.log(user)
          if (err) { console.error(err)};
        res.render('reviews/show', { reviews: reviews, user: user });
      });
      }
      else {
        res.render('reviews/show', { reviews: reviews });
      }
    });
  });

module.exports = router;
