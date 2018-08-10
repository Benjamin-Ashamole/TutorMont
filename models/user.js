const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const Schema = mongoose.Schema;

const UserSchema = new Schema ({
     first: { type: String, required: true},
     last: { type: String, required: true},
     email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    school: { type: String, required: true},
    isTutor: { type: Boolean, required: true, default: false},
    price: {type: Number},
     tel: { type: Number },
     class: { type: Array },
     points: { type: Number, default: 0 },
     imageUrl: { type: String },
     upVotes: [ { type: Schema.Types.ObjectId, ref: 'User', required: true} ],
     downVotes: [ { type: Schema.Types.ObjectId, ref: 'User', required: true} ],
     voteTotal:  { type: Number, default: 0 },
     createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function(next) {
    let user = this;
    
    if (!user.isModified('password')) 
    return next();
  
    bcrypt.hash(user.password, 10, function (err, hash){
      if (err) return next(err);
  
      user.password = hash;
      next();
    });
  });
  
  UserSchema.statics.authenticate = function(username, password, next) {
    User.findOne({ username: username })
      .exec(function (err, user) {
        if (err) {
          return next(err)
        } else if (!user) {
          var err = new Error('User not found.');
          err.status = 401;
          return next(err);
        }
        bcrypt.compare(password, user.password, function (err, result) {
          if (result === true) {
            return next(null, user);
          } else {
            return next();
          }
        });
      });
  }

  
  const User = mongoose.model('User', UserSchema);
  

module.exports = User;
