const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('./helpers/auth');
const reviews = require('./reviews');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');


aws.config.update({
  secretAccessKey:  process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region:  process.env.S3_REGION,
  s3BucketEndpoint: true,
  endpoint: 'https://s3.amazonaws.com/tutor-app-image-upload-bucket'
});

s3 = new aws.S3();

let upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    key: function (req, file, cb) {
      console.log(file);
      cb(null, file.originalname); //use Date.now() for unique file keys
    }
  })
});


/* GET users listing. */
//User.find({ first: regex }

router.get('/', auth.requireLogin, (req, res, next) => {
  const regex = new RegExp(escapeRegex(req.query.search), 'gi');
  if (req.query.search){
    User.find({
      $and : [
        { $or : [ { first : regex }, { last : regex }, { class : regex } ] },
        { $or : [ { isTutor : true } ] }
      ] }, (err, users) => {
      if (err) {
          res.render('error') 
        }
      res.render('users/index', { users: users });
    });
  }
});

// Users new
router.get('/new', function(req, res, next) {
  res.render('users/new');
});

// Users create
router.post('/', upload.single('imageUrl'), (req, res, next) => {
  let user = new User(req.body);
//});
   if (req.file) {
     user.imageUrl = req.file.location; 
   }
  if (req.body.isTutor === true) {
    user.isTutor = true;
  }
   if (req.body.class !== "") {
    user.class = classLister(req.body.class); 
   }
   if (checkEmail(req.body.email) === false) {
      return res.render('error')
   }
  user.save(function(err, user) {
    if (err) {
      console.log(err);
    }
    User.authenticate(req.body.username,
    req.body.password, (err, user) => {
      if (err || !user) {
        // console.log(err.message);
        // console.log(user);
        const next_error = new Error("Username or password incorrect");
        next_error.status = 401;

        return next(next_error);
      } else {
        req.session.userId =  user._id;
        return res.redirect('/');
      }
    });
  });
});

//user show
router.get('/:id', (req, res, next) => {
  User.findById(req.params.id, (err, user) => {
    if (err) {
      console.error(err);
    }
    res.render('users/show', { user: user, vote: req.session.userId });
  });
});

//profile show
router.get('/:id/profile', auth.requireLogin, (req, res, next) => {
  User.findById(req.session.userId, (err, user) => {
    if (err) { console.error(err) };
    res.render('users/profile', { user });
  });
});

//profile edit (this edits the users own profile)
router.get('/:id/edit', auth.requireLogin, (req, res, next) => {
  User.findById(req.session.userId, function(err, user) {
    if (err) { console.error(err); }

    res.render('users/edit', { user });
  });
});

//profile update

router.post('/:id', auth.requireLogin, upload.single('imageUrl'), (req, res, next) => {
  User.findByIdAndUpdate(req.session.userId, req.body, (err, user) => {
    if (req.body.istutor === true) {
      user.isTutor = true;
    }
    if (req.body.class !== "") {
      user.class = classLister(req.body.class);
    }

    user.save( (err, user) => {
      if(err) { console.error(err) };
      return res.redirect( req.session.userId +'/profile');
    });
  });
});

//User delete
router.delete('/', auth.requireLogin, (req, res, next) => {
  User.findByIdAndRemove(req.body.delete_id, function(err, user) {
    if (err) { console.error(err); }
    res.redirect('/');
  });
});

router.put('/:id/vote-up', (req, res) => {
  const user = req.user;
  if (user === null) {
    return;
  }
  User.findById(req.params.id).then((user) => {
    user.downVotes.pull(req.session.userId);
    user.upVotes.addToSet(req.session.userId);
    user.voteTotal = user.upVotes.length - user.downVotes.length;
    return user.save(); // FIXME: return promise
  }).then((user) => {
    res.status(200).json({ voteScore: user.voteTotal });
  }).catch((err) => {
    console.log(err);
  });
});

router.put('/:id/vote-down', (req, res) => {
  const user = req.user;
  // console.log('>>>>>>>>>>>>>'+ user._id + '<<<<<<<<<<<');
  if (user === null) {
    return;
  }
  User.findById(req.params.id).then((user) => {
    user.upVotes.pull(req.session.userId);
    user.downVotes.addToSet(req.session.userId);
    user.voteTotal = user.upVotes.length - user.downVotes.length;

    user.save();

    res.status(200).json({ voteScore: user.voteTotal });
  }).catch((err) => {
    console.log(err);
  });
});

router.use('/:userId/reviews', reviews)


function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function classLister(stringList) {
  return stringList.split(',');
}

function checkEmail(email) {
  return email.endsWith('edu');
}
module.exports = router;
