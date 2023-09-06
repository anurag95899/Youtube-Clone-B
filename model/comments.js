var mongoose = require('mongoose');



var commentSchema = mongoose.Schema({
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'video'
  },
});


module.exports = mongoose.model('comment', commentSchema);
