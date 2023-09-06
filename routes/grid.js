const methodOverride = require('method-override');
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')
const fs = require('fs')
const { GridFsStorage } = require('multer-gridfs-storage');


const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/tube')

const db = mongoose.connection

var storage = new GridFsStorage({
    url: 'mongodb://127.0.0.1:27017/tube',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'user'
                };
                resolve(fileInfo);
            });
        });
    }
});
var videoStorage = new GridFsStorage({
    url: 'mongodb://127.0.0.1:27017/tube',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'video'
                };
                resolve(fileInfo);
            });
        });
    }
});

function fileFilters(req, file, cb) {
    if(file.mimetype === 'image/jpg' || file.mimetype === 'image/png'|| file.mimetype === 'image/jpeg'){
    cb(null, true)
    }
    else{
     cb(new Error('only jpg, png, jpeg file are supported'))
    }
  }



const upload = multer({ storage : storage, fileFilter:fileFilters});
const videoUpload = multer({ storage: videoStorage})
module.exports = { upload, videoUpload}