var settings = require('../settings');
var mongoose = require('mongoose');

//连接数据库
mongoose.connect(settings.dbUrl);

//定义用户模型骨架
var UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String
});

exports.User = mongoose.model('user', UserSchema);

//定义文章模型
var PostSchema = new mongoose.Schema({
    name: String,
    title: String,
    time: {time: String, "week": String, "day": Number, "month": Number, "year": Number},
    post: String,
    tags: [String, String, String],
    comments: Array,
    reprint_info: {
        reprint_from: {name: String, time: {day: Number}, title: String},
        reprint_to: {name: String, 'time.day': Number, title: String}
    },
    pv: Number
});

exports.Post = mongoose.model('post', PostSchema);

var CommentSchema = new mongoose.Schema({
    name: String,
    time: String,
    email: String,
    content: String,
    website: String
});

exports.CommentModel = mongoose.model('comment', CommentSchema);