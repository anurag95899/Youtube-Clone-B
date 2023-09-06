var mongoose = require('mongoose');



var likeSchema = mongoose.Schema({
    user: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'User' 
        },
    post: {
         type: mongoose.Schema.Types.ObjectId, 
         ref: 'video'
         },
});


module.exports = mongoose.model('like', likeSchema);
