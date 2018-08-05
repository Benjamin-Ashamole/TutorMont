const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('./helpers/auth');
const reviews = require('./reviews');
const multer = require('multer');
const Upload = require('s3-uploader');

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
      console.log(file)
      let extArray = file.mimetype.split("/");
      let ext = extArray[extArray.length - 1];
      cb(null, Date.now() + "." + ext);
  }
});

const upload = multer({ storage });

let client = new Upload(process.env.S3_BUCKET, {
  aws: {
    path: 'images/',
    region: process.env.S3_REGION,
    acl: 'public-read',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  cleanup: {
    original: true,
    versions: true
  },
  versions: [{}]
});

/* GET users listing. */
router.get('/', auth.requireLogin, (req, res, next) => {
  const regex = new RegExp(escapeRegex(req.query.search), 'gi');
  if (req.query.search) {
  //User.find({ first: regex } 
    User.find( { $or: [ { first: regex }, { last: regex }, { school: regex }, { class: regex }, ] }, function(err, users) {
      if(err) {
        res.render('users/new');
      }
      res.render('users/index', { users: users}); 
  });
  }

  // else {
  //   User.find( { class: regex }, (err, users) => {
  //     if (err) {
  //       res.render('users/new');
  //     }
  //     res.render('users/index', { users: users});
  //   })
  // }
});


// Users new
router.get('/new', function(req, res, next) {
  res.render('users/new');
});

// Users create
router.post('/', upload.single('imageUrl'), (req, res, next) => {
  const user = new User(req.body);
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

//user show - users/27262524
router.get('/:id', (req, res, next) => {
  User.findById(req.params.id, (err, user) => {
    if (err) {
      console.error(err);
    }
    res.render('users/show', { user });
  });
});

//user update
router.post('/:id', auth.requireLogin, (req, res, next) => {
  User.findById(req.params.id, function(err, user) {
    user.points += parseInt(req.body.points);

    user.save(function(err, user) {
      if(err) { console.error(err) };

      return res.redirect(/users/+req.params.id);
    });
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

router.post('/:id', auth.requireLogin, (req, res, next) => {
  User.findByIdAndUpdate(req.session.userId, req.body, function(err, user) {
    if (req.body.isTutor === true) {
      user.isTutor = true;
    }
     if (req.body.class !== "") {
      
      user.class = classLister(req.body.class); 
     }
  
     if (checkEmail(req.body.email) === false) {
       console.error(err);
     }
    if (err) { console.error(err); }
    res.redirect('/trips/' + req.params.id);
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
