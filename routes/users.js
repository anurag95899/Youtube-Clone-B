var mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/tube")
  .then(function (created) {
    console.log("created!");
  });

var userSchema = mongoose.Schema({
  videos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "video"
  }],
  channelname: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    uniqueCaseInsensitive: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "video"
  }],
  watchlater: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "video"
  }],
  subscribed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],

  subscriber: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  otp:{
    type: String,
    default: ""
   },
  password: String,
  profileimg: String
});


userSchema.plugin(plm, { usernameField: "email"});
module.exports = mongoose.model('user', userSchema);
