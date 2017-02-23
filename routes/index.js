var express = require('express');
var router = express.Router();
//var crypto = require('crypto');
var User = require('../models/db').User;
var Post = require('../models/db').Post;
var CommentModel = require('../models/db').CommentModel;
var DateObj = require('../tools/Date');
var markdown = require('markdown').markdown;
//文件上传中间件
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../public/images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.' + file.mimetype.slice(file.mimetype.indexOf('/') + 1))
    }
});

var upload = multer({storage: storage});

//var md5 = crypto.createHash('md5');

/* pages */
module.exports = function (app) {

    app.get('/', function (req, res, next) {

        Post.find({}, function (err, posts) {
            if (err) {
                posts = [];
            }

            posts.forEach(function (post) {
                post.post = markdown.toHTML(post.post);
            });

            posts.sort(function (a, b) {
                return new Date(a.time.time) < new Date(b.time.time) ? 1 : -1;
            });

            res.render('index', {
                title: '姚力晓的博客首页',
                posts: posts
            });
        });
    });

    app.get('/login', checkNotLogin, function (req, res, next) {
        res.render('users/login', {title: '登录'});
    });

    app.post('/login', checkNotLogin, function (req, res, next) {
        //生成密码的md5值
        //var password = md5.update(req.body.password).digest('hex');
        var password = req.body.password;

        //检查用户是否存在
        User.findOne({name: req.body.name}, function (err, user) {
            if (!user) {
                console.log('log', 1)
                req.flash('error', '用户不存在！');
                return res.redirect('/login');//用户不存在重新登录
            }
            //检查密码是否一致
            if (user.password != password) {
                console.log('log', 2)
                req.flash('error', '密码错误！');
                return res.redirect('/login');//密码错误重新登录
            }

            //用户名和密码都匹配后将用户信息存入session
            req.session.user = user;
            req.flash('success', '登录成功！');
            res.redirect('/');//登录成功后转到主页
        });
    });

    app.get('/reg', checkNotLogin, function (req, res, next) {
        res.render('users/reg', {title: '注册'});
    });

    app.post('/reg', checkNotLogin, function (req, res, next) {
        var newUser = {
            name: req.body.name,
            password: req.body.password,
            email: req.body.email
        }

        if (newUser.password != req.body['password-repeat']) {
            req.flash('error', '两次输入的密码不一致！');
            return res.redirect('/reg') //返回注册页
        }

        //生成密码的 md5 值
        //newUser.password = md5.update(req.body.password).digest('hex');

        //检查用户名是否已经存在
        User.findOne({name: newUser.name}, function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', '用户已存在！');
                return res.redirect('/reg');//返回注册页
            }
            //如果不存在则新增用户
            User.create(newUser, function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//注册失败返回注册页
                }
                req.session.user = user;
                req.flash('success', '注册成功！');
                res.redirect('/');//注册成功返回主页
            });
        });
    });

    app.get('/post', checkLogin, function (req, res, next) {
        res.render('articles/post', {title: '发表文章'});
    });

    app.post('/post', checkLogin, function (req, res, next) {
        var currentUser = req.session.user;
        var post = {
            name: currentUser.name,
            title: req.body.title,
            post: req.body.post,
            tags: [req.body.tag1, req.body.tag2, req.body.tag3],
            comments: [],
            reprint_info: {},
            pv: 0
        };

        post.time = DateObj();

        Post.create(post, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发表成功！');
            res.redirect('/');//发表成功转到主页
        })
    });

    app.get('/logout', checkLogin, function (req, res, next) {
        //通过把req.session.user赋值为null，丢掉用户信息，实现用户的退出
        req.session.user = null;
        req.flash('success', '退出成功');
        res.redirect('/');//退出成功跳到主页
    });

    app.get('/upload', checkLogin, function (req, res) {
        res.render('articles/upload', {title: '文件上传'});
    });

    app.post('/upload', checkLogin, upload.single('imgname'), function (req, res) {
        console.log(req.file);
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });

    app.get('/links', function (req, res) {
        res.render('articles/links', {title: '友情链接'});
    });

    app.get('/search', function (req, res) {
        var keyword = req.query.keyword;
        var pattern = new RegExp(keyword, 'i');
        Post.find({title: pattern}, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            posts.sort(function (a, b) {
                return new Date(a.time.time) < new Date(b.time.time) ? 1 : -1;
            });

            res.render('articles/search', {
                title: 'SEARCH:' + keyword,
                posts: posts
            })
        })
    });

    app.get('/u/:name', function (req, res) {
        //检查用户是否存在
        User.findOne({name: req.params.name}, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在！');
                return res.redirect('/');//用户不存在跳转到主页
            }
            //查询并返回该用户的所有文章
            Post.find({name: user.name}, function (err, posts) {
                if (err) {
                    req.flash('error', err);
                    res.redirect('/');
                }

                posts.forEach(function (post) {
                    post.post = markdown.toHTML(post.post);
                });

                res.render('articles/user', {
                    title: user.name,
                    posts: posts
                })
            })
        });
    });

    app.get('/u/:name/:title', function (req, res) {
        Post.findOne({name: req.params.name, title: req.params.title}, function (err, post) {
            if (err) {
                req.flash('error', err);
                res.redirect('/');
            }

            Post.update({name: req.params.name, title: req.params.title}, {$inc: {'pv': 1}}, function (err) {
                if (err) {
                    req.flash('error', err);
                    res.redirect('/');
                }
            });
            post.post = markdown.toHTML(post.post);

            res.render('articles/article', {
                title: req.params.title,
                post: post
            })
        })
    });

    app.get('/edit/:name/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;

        Post.findOne({name: currentUser.name, title: req.params.title}, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }

            res.render('articles/edit', {
                title: '编辑',
                post: post
            })
        })
    });

    app.post('/edit/:name/:title', checkLogin, function (req, res) {
        Post.update({name: req.session.user.name, title: req.params.title}, {post: req.body.post}, function (err) {
            var url = encodeURI('/u/' + req.params.name + '/' + req.params.title);
            if (err) {
                req.flash('error', err);
                return res.redirect(url);//出错  返回文章页
            }
            req.flash('success', '修改成功！');
            res.redirect(url);//成功 返回文章页
        })
    });

    app.get('/reprint/:name/:day/:title', checkLogin, function (req, res) {
        var condition = {name: req.params.name, 'time.day': req.params.day, title: req.params.title};
        Post.findOne(condition, function (err, post) {
            if (err) {
                req.falsh('error', err);
                return res.redirect('back');
            }

            var currentUser = req.session.user;
            var reprint_from = {name: post.name, 'time.day': post.time.day, title: post.title};
            var reprint_to = {name: currentUser.name};
            console.log(reprint_from);
            Post.update(condition, {$set:{'reprint_info.reprint_from.name': post.name}}, function (err, doc, b) {
            });
            console.log(post);
        })
    });

    app.get('/remove/:name/:title', checkLogin, function (req, res) {
        var currentUser = req.session.user;
        Post.remove({name: currentUser.name, title: req.params.title}, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功！');
            res.redirect('/');
        })
    });

    app.post('/u/:name/:title', function (req, res) {
        var date = new Date();
        var time = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var currentUser = req.session.user;

        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };

        Post.update({
            name: currentUser.name,
            title: req.params.title
        }, {$addToSet: {comments: comment}}, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }

            CommentModel.create(comment, function (err, docs) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                req.flash('success', '留言成功！');
                res.redirect('back');
            })
        });
    });

    app.get('/archive', function (req, res) {
        Post.find({}, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }

            posts.sort(function (a, b) {
                return new Date(a.time.time) < new Date(b.time.time) ? 1 : -1;
            });

            res.render('articles/archive', {
                title: '文章列表页',
                posts: posts
            });
        })
    });

    app.get('/tags', function (req, res) {
        Post.distinct('tags', function (err, tags) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('articles/tags', {
                title: '标签',
                tags: tags
            })
        })
    });

    app.get('/tags/:tag', function (req, res) {
        Post.find({tags: req.params.tag}, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('articles/tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts
            })
        })
    });

    app.use(function (req, res) {
        res.render('public/404');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录！');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录！');
            res.redirect('back');//返回之前的页面
        }
        next();
    }

};
