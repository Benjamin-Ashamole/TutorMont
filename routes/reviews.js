const express = require('express');
//const router = express.Router();
const router = express.Router({mergeParams: true});
const Review = require('../models/review');
const auth = require('./helpers/auth');
const User = require('../models/user');
const users = require('./users');

// router.get('/', auth.requireLogin, (req, res, next) => {
//   User.findById(req.params.id, (err, user) => {
//     if (err) { console.error(err) };
//     Review.find({user}, (err, reviews) => {
//       if (err) { console.error(err) };
//       res.render('reviews/index', { user: user, reviews: reviews });
//     });
//   });
  
//});
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

  //review show
  // router.get('/:id', auth.requireLogin, (req, res, next) => {
  //   Review.findById(req.params.id, function(err, review) {
  //     if(err) { console.error(err) };
  
  //       Post.find({ room: room}).populate('comments').exec(function(err, posts) {
  //       if(err) { console.error(err) };
  
  //        res.render('rooms/show', { room: room, posts: posts });
  //      });
  //   });
  // });

  // router.get('/:id', auth.requireLogin, (req, res, next) => {
    // User.findById().then((user) => {
    //   return Review.find({ });
    // }).then((reviews) => {
    //   res.render()
    // }).catch(() => {
    //   console.log()
    // })


  //   console.log('>>>>> Get reviews for user', req.params.id)
  //    User.findById(req.params.id, (err, user) => {
  //      if (err) { console.error(err) };
  //      console.log('>>>>>> Found a user', user);
      
  //   });
  // }); 'tutor': req.params.id
  router.get('/', auth.requireLogin, (req, res, next) => {
    console.log('>>>>>>>>>>'+ req.params.id)
  Review.find({ tutorId: req.params.userId },  (err, reviews) => {
    console.log('>>>>>> Found reviews ');
    console.log(reviews);
    if (err) { console.error(err) };
    res.render('reviews/show', { reviews: reviews });
  });
});
module.exports = router;