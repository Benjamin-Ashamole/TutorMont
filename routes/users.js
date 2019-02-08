const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Token = require('../models/token');
const auth = require('./helpers/auth');
const reviews = require('./reviews');
const aws = require('aws-sdk');
const bodyParser = require('body-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const request = require('request');




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


router.get('/', auth.requireLogin, (req, res, next) => {
  User.findById(req.session.userId, (err, currentUser) =>{
    if (err) {console.error(err)}
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    if (req.query.search) {
      User.find({
        $and : [
          { $or : [ { first : regex }, { last : regex }, { class : regex } ] },
          { $or : [ { isTutor : true } ] }
        ] }, (err, users) => {
          if (err) { console.log(err)}
          let realUsers = [];
          for (let user of users) {
            if (user.school == currentUser.school) {
              realtutors = realUsers.push(user)
            }
          }
          res.render('users/index', { realUsers: realUsers, currentUser:currentUser, users: users })
        }).sort({voteTotal: -1})
    }
  })
})
// Users new
router.get('/new', function(req, res, next) {
  const url = "http://universities.hipolabs.com/search?country=United+States&name=james";
   request.get(url, (err, response, schools) => {
     if(err) { console.error(err) }
      schools = JSON.parse(schools);
      console.log(schools);
      let allSchools = [];
      for (let school of schools) {
        //console.log(school.name)
        allSchools.push(school.name);
    }
  //  console.log('allSchools', allSchools)

    const jschools = {
      allSchools
    }
    //console.log(jschools);
    res.render('users/new', { schools: schools });
 });
});


//Users create
router.post('/', upload.single('imageUrl'), (req, res, next) => {
  User.findOne({email: req.body.email}, (err, foundUser) => {
    if (err) {console.error(err)};
    if (foundUser){
      return res.render('errors/email');
    }
    let user = new User(req.body);
    console.log(user)
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
        return res.render('errors/edu')
     }
    user.save(function(err, user) {
      if (err) { console.error(err) };
      let token = new Token({ userId: user._id, token: crypto.randomBytes(16).toString('hex') });
      token.save((err, token) => {
        if(err) { console.error(err) };

        let transporter = nodemailer.createTransport({ service: 'AOL', auth: { user: process.env.AOL_USERNAME, pass: process.env.AOL_PASSWORD } });
         let mailOptions = { from: 'obinna0515@aol.com', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n Please verify your account by clicking the link:\nhttp:\/\/'+req.headers.host+'\/confirmation\/'+token.token+'.\n' };
          transporter.sendMail(mailOptions, function (err) {
            console.log(err)
           if (err) {
             const sendMail_error = new Error('Email was not sent');
             sendMail.status = 500;
             return next(sendMail_error);
           }
           // { return res.status(500).send({ msg: err.message }); }

           else {
             res.status(200).send('A verification email has been sent to ' + user.email + '.');
           }
      })
    });
  });
});
});

//User create old
router.post('/', upload.single('imageUrl'), (req, res, next) => {
  let user = new User(req.body);
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
    User.authenticate(req.body.email,
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

router.post('/confirmation', (req, res, next) => {
  Token.findOne({ token: req.body.token }, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        // If we found a token, find a matching user
        User.findOne({ _id: token._userId }, function (err, user) {
            if (!user) return res.status(400).send({ msg: 'We were unable to find a user for this token.' });
            if (user.isVerified)
            return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });

            // Verify and save the user
            user.isVerified = true;
            user.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send("The account has been verified. Please log in.");
                res.render('confirmation', {token: token});
            });
        });
    });
});

router.post('/resendTokenPost', (req, res, next) => {
  User.findOne({ email: req.body.email }, function (err, user) {
       if (!user) return res.status(400).send({ msg: 'We were unable to find a user with that email.' });
       if (user.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });

       // Create a verification token, save it, and send email
       var token = new Token({ _userId: user._id, token: crypto.randomBytes(16).toString('hex') });

       // Save the token
       token.save(function (err) {
           if (err) { return res.status(500).send({ msg: err.message }); }

           // Send the email
           let transporter = nodemailer.createTransport({ service: 'AOL', auth: { user: process.env.GMAIL_USERNAME, pass: process.env.GMAIL_PASSWORD } });
            let mailOptions = { from: 'obinna0515@aol.com', to: user.email, subject: 'Account Verification Token', text: 'Hello,\n\n' + 'Please verify your account by clicking the link: \nhttp:\/\/' + req.headers.host + '\/confirmation\/' + token.token + '.\n' };
           transporter.sendMail(mailOptions, function (err) {
               if (err) { return res.status(500).send({ msg: err.message }); }
               res.status(200).send('A verification email has been sent to ' + user.email + '.');
           });
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
    return location.reload();
    //res.redirect('/:id/profile', { user });
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
    return location.reload();
    //res.redirect('/:id/profile', { user });
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

function tutors() {
users.school === currentUser.school
}

module.exports = router;
