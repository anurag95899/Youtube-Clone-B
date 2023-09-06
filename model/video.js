var mongoose = require('mongoose');



var videoSchema = mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    video: String,
    tittle: String,
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'comment'
    }],
    like: {
        type: Array,
        default: []
    }
},
{
    timestamps: true
  }
);


module.exports = mongoose.model('video', videoSchema);
