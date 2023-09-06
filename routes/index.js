const express = require('express');
const router = express.Router();
const { upload, videoUpload } = require('./grid');
const usermodel = require('./users');
const videoModel = require('../model/video')
const passport = require('passport');
const multer = require('multer');
const path = require('path');
const gridfsStream = require('gridfs-stream');
const mongoose = require('mongoose');
const { GridFsStorage } = require('multer-gridfs-storage');
const connect = mongoose.connection;
const methodOverride = require("method-override")
const commentModel = require('../model/comments')
const likeModel = require('../model/like')
const nodemailer = require("../nodemailer")
const crypto = require('crypto')
const fs = require("fs");
var flash = require('connect-flash');


const GoogleStrategy = require('passport-google-oidc');

require('dotenv').config()

passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: ['email', 'profile']
}, async function verify(issuer, profile, cb) {
  user = await usermodel.findOne({ email: profile.emails[0].value })
  if (user) {
    return cb(null, user)
  } else {

    let newUser = await usermodel.create({ name: profile.displayName, email: profile.emails[0].value })
    newUser.save();
    return cb(null, newUser);
  }

}));

router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/mytube',
  failureRedirect: '/'
}));


function fileFilter(req, file, cb) {
  if (file.mimetype === "video/mp4" || file.mimetype === "video/mkv" || file.mimetype === "video/mov" || file.mimetype === 'video/avi' || file.mimetype === 'video/flv' || file.mimetype === "video/wmv") {
    cb(null, true)
  }
  else {
    cb(new Error('Only video files are allowed!'))
  }
}

let gfs
let gfsVideo
let gfsBucket
let gfsBucketVideo

connect.once('open', function () {
  gfs = gridfsStream(connect.db, mongoose.mongo)
  gfsVideo = gridfsStream(connect.db, mongoose.mongo)
  gfs.collection('user')
  gfsVideo.collection('video')
  gfsBucket = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: 'user',
  })
  gfsBucketVideo = new mongoose.mongo.GridFSBucket(connect.db, {
    bucketName: 'video',
  })
})

router.use(methodOverride('_method'));


const localstrategy = require("passport-local");
const { subscribe } = require('diagnostics_channel');
passport.use(new localstrategy({ usernameField: "email", usernameQueryFields: ["email"], }, usermodel.authenticate()));


/* GET home page. */
router.get('/', isLoggedOut, function (req, res) {
  res.render('index');
});


//videoupload page
router.get('/videouploads', isLoggedIn, async function (req, res) {
  var loginuser = await usermodel.findOne({email: req.user.email})
  if(loginuser.channelname === 0 ||loginuser.channelname === undefined ){
     res.send(" without Channel Name you cannot upload Video !")
  }
  res.render('videoupload');
});


//Edit page
router.get('/editprofile', isLoggedIn, async function (req, res) {
  var loginuser = await usermodel.findOne({ email: req.user.email })
  res.render('edit', { loginuser});
});


// profileimage upload router
router.post('/upload', upload.single("filename"), function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .then(function (user) {
      user.profileimg = req.file.filename;
      user.save()
        .then(function () {
          res.redirect("/profile");
        })
    })
});


//videoupload router
router.post('/videoupload', isLoggedIn, videoUpload.single("videoupload"), async function (req, res) {
  try {
    const loggedinuser = await usermodel.findOne({ email: req.user.email })
    if(loggedinuser.channelname === 0 ||loggedinuser.channelname === undefined ){
      res.send(" without Channel Name you cannot upload Video !")
   }
    let videocreated = await videoModel.create({
      video: req.file.filename,
      tittle: req.body.tittle,
      userid: loggedinuser._id,
    })
    loggedinuser.videos.push(videocreated);
    await loggedinuser.save();
    res.redirect('/mytube')
  } catch (err) {
    console.log(err)
    res.status(500)
  }
});


//image stream router
router.get("/getFile/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }).then(function () {
  })
  gfsBucket.openDownloadStreamByName(req.params.filename).pipe(res);
})


//video stream router
router.get("/getvideo/:filename", async function (req, res) {
  try {
    var currentvideos = await gfsVideo.files.findOne({ filename: req.params.filename })

    // Ensure there is a range given for the video
    const range = req.headers.range
    if (!range) {
      res.status(400).send('Requires Range header')
    }
    //get a file size
    const VideoSize = currentvideos.length - 2
    const parts = range.split('-')
    const start = parseInt(parts[0].replace('bytes=', ''))
    const end = parts[1] ? parseInt(parts[1]) : VideoSize - 1
    const chunkSize = (end - start) + 1 // 1MB
    if (start > VideoSize) start = VideoSize - 1

    // Create headers
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${VideoSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    gfsBucketVideo.openDownloadStreamByName(req.params.filename, {
      start,
      end,
    }).pipe(res)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server Error')
  }
})


//updateuser router
router.post('/update', isLoggedIn, function (req, res) {
  usermodel.findOneAndUpdate({ email: req.user.email },
    {
      channelname: req.body.channelname,
      name: req.body.name,
      email: req.body.email,
    })
    .then(function (data) {
      res.redirect("/profile")
    })
})


//register new user
router.post('/register', function (req, res) {
  var newuser = new usermodel({
    channelname: req.body.channelname,
    name: req.body.name,
    email: req.body.email
  })
  usermodel.register(newuser, req.body.password)
    .then(function (userdets) {
      passport.authenticate('local')(req, res, function () {
        res.redirect("/mytube");
      })
    }).
    catch(err => {
      res.status(402).json({ status: "Failed", message: err })
    })
})


//any user profile

router.get('/user/:name', isLoggedIn, async (req, res) => {
  var loginuser = await usermodel.findOne({ email: req.user.email })
  var userDetails = await usermodel.findOne({ name: req.params.name }).populate("videos")
  userDetails = userDetails
  res.render("alluser", { userDetails: userDetails, loginuser })
});




//login page
router.get('/login', isLoggedOut, function (req, res) {
  res.render('login');
})

//subscribe page
router.get('/subscriber', isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email }).populate("subscribed")
    .then(function (loginuser) {
      res.render('subscriber', { loginuser });
    })
})


//mytube page
router.get('/mytube', isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email }).populate('videos')
    .then(function (loginuser) {
      videoModel.find().populate('userid')
        .then(function (allvideos) {
          res.render('mytube', { loginuser, allvideos });
        })
    })
})


router.get('/watch/:videos', isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .then(function (loginuser) {
      videoModel.findOne({ _id: req.params.videos }).populate("userid").populate('like')
        .populate({
          path: 'comments',
          populate: {
            path: 'author'
          }
        })
        .then(function (watchvideo) {
          res.render('watchvideo', { loginuser, watchvideo })
        })
    })
})



//userprofile page
router.get('/profile', isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email }).populate("videos")
    .then(function (loginuser) {
      res.render('profile', { loginuser });
    });
});

//watchlater router
router.get("/watchlater/:video", isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .then(function (loggedinuser) {
      loggedinuser.watchlater.push(req.params.video);
      loggedinuser.save()
        .then(function () {
          res.redirect("back")
        })
    })
})

//remove from watch later
router.get("/removefromwatchlater/:video", isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .then(function (loggedinuser) {
      var index = loggedinuser.watchlater.indexOf(req.params.id);
      loggedinuser.watchlater.splice(index, 1)
      loggedinuser.save()
        .then(function () {
          res.redirect("back")
        })
    })
})

//like the video

router.get('/like/:likesvideo', function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .then(function (loginuser) {
      videoModel.findOne({ _id: req.params.likesvideo })
        .then(function (video) {
          if (video.like.indexOf(loginuser.username) === -1) {
            video.like.push(loginuser.username)
            loginuser.likes.push(video._id)
          }
          else {
            video.like.splice(video.like.indexOf(loginuser.username), 1)
            loginuser.likes.splice(loginuser.likes.indexOf(video._id))
          }
          video.save()
            .then(function () {
              res.redirect('back')
            })
        })
    })
});


//comments router

router.post('/comments/:video', isLoggedIn, async (req, res) => {
  let currentUser = await usermodel.findOne({ email: req.user.email })
  let currentvideo = await videoModel.findOne({ _id: req.params.video })
  let newcomments = await commentModel.create({
    content: req.body.content,
    author: currentUser._id,
    post: currentvideo._id
  })
  currentvideo.comments.push(newcomments)
  await currentvideo.save()
  res.redirect("back")
})

//scbscribe router
router.get('/subscribe/:channel', async function (req, res) {
  let loginuser = await usermodel.findOne({ email: req.user.email })
  let subscribeUser = await usermodel.findOne({ _id: req.params.channel })
  let index = loginuser.subscribed.indexOf(req.params.channel);
  if (index === -1) {
    loginuser.subscribed.push(req.params.channel);
    subscribeUser.subscriber.push(loginuser._id);
    await loginuser.save()
    await subscribeUser.save()
    loginuser = await usermodel.findOne({ username: loginuser.username })
    res.redirect('back')
  } else {
    loginuser.subscribed.splice(index, 1);
    subscribeUser.subscriber.splice(subscribeUser.subscriber.indexOf(loginuser._id), 1)
    await loginuser.save()
    await subscribeUser.save()
    res.redirect("back")
  }


});


//router to delete loginuser video

router.get("/delete/:id", async function (req, res) {
  let user = await usermodel.findOne({ usrsername: req.user.username });
  let video = await videoModel.findOne({ _id: req.params.id });
  let videoFile = await gfsVideo.files.findOne({ filename: video.video });
  gfsBucketVideo.delete(videoFile._id);
  let video_delete = await videoModel.findOneAndDelete({ _id: req.params.id });
  let index = user.videos.indexOf(req.params.id)
  user.videos.splice(index, 1)
  user.save()
    .then(function () {
      res.redirect("/profile");
    })
});

//watchlater page

router.get('/watchlater', isLoggedIn, function (req, res) {
  usermodel.findOne({ email: req.user.email })
    .populate({
      path: 'watchlater',
      populate: {
        path: 'userid'
      }
    })
    .then(function (loginuser) {
      res.render("watchlater", { loginuser })
    })
})

//searching
router.post("/searchUser", async function (req, res, next) {
  var search = "";
  if (req.body.search) {
    search = req.body.search;
  }
  var data = await usermodel.find({
    channelname: { $regex: ".*" + search + ".*", $options: "i" },
  });
  res.status(200).send({ success: true, data: data });
});

//forget page
router.get("/forget", function (req, res) {
  res.render("forget")
})

//forget pageform

router.post('/forgot', function (req, res) {
  usermodel.findOne({ email: req.body.email })
    .then(function (user) {
      if (user) {
        crypto.randomBytes(17, async function (err, buff) {
          const otpstr = buff.toString("hex")
          user.otp = otpstr
          await user.save()
          nodemailer(req.body.email, otpstr, user._id).then(function () {
            console.log("send mail")
          })
        })
      }
      else {
        res.send("not send")
      }
    })
});

//// forget set router

router.get('/forgot/:id/otp/:otp', async function (req, res) {
  let user = await usermodel.findOne({ _id: req.params.id })
  if (user.otp === req.params.otp) {
    res.render('reset', { id: req.params.id })
  }
  else {
    res.send("worng or expired link")
  }
});


// reset router
router.post('/reset/:id', async function (req, res) {
  let user = await usermodel.findOne({ _id: req.params.id });
  user.setPassword(req.body.newpassword, async function () {
    user.otp = "";
    await user.save()
    res.redirect('/profile')
  })
});



//login router
router.post('/login', passport.authenticate('local', {
  successRedirect: '/mytube',
  failureRedirect: '/'
}), function (req, res) { });



//logout router
router.get('/logout', isLoggedIn, function (req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



function isLoggedOut(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect("/mytube")
  }
  else {
    return next();
  }
}



function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect("/")
  }
}

module.exports = router;
