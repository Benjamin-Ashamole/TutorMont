const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const User = require('../models/user');


const ReviewSchema = new Schema ({
    body:{ type: String, required: true},
    tutorId: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
         },
    createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
