var express = require('express');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var socketIo = require('socket.io');
var cors = require('cors');
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
var cookieParser = require('cookie-parser');

var app = express();
var server = require('http').createServer(app);
var secureUserCookieName = 'pusher-user';
app.use(cors({
    origin: function(origin, callback){
        callback(null, true);
    },
    credentials: true
}));
app.use(bodyParser());
app.use(cookieParser());
// ----------------- cookie authentication
app.use('/api', function(req, res, next){
    var user = req.cookies[secureUserCookieName];
    if(!user){
        res.send(401);
        return;
    }
    req.user = user;
    next();
});

app.get('/api/profile', function(req, res) {
    res.send(req.user);
});

db = {};
db.users = new Datastore({ filename: 'db/users', autoload: true });
db.queues = new Datastore({ filename: 'db/queues', autoload: true });

// ------------ sending messages
var io = socketIo.listen(server);

io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function(room) {
        socket.join(room);
        db.queues.find({room: room}, function(err, docs){
            docs.forEach(function(doc){
                socket.emit('message', doc.data);
            });
        });
    });
});

function emitMessageFromQueue(room, data) {
    io.sockets.in(room).emit('message', data);
}

// -------------- managing queue

app.post('/api/queue', function (req, res) {
    var name = req.body.name;
    var website = req.body.website;
    var room = req.user.githubId + '$' + website; // TODO is $ a good separator?
    db.queues.insert({name: name,
        website: website,
        user: req.user.githubId,
        room: room,
        data: req.body.data});
    process.nextTick(function(){
        emitMessageFromQueue(room, req.body.data);
    });
    res.send("OK");
});

app.get('/api/queues', function (req, res) {
    db.queues.find({user: req.user.githubId}, function(err, docs){
        res.send(docs);
    });
});

//app.delete('/queue', function (req, res) {
//
//});

// --------------- registration
app.use(passport.initialize());

passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
    },
    function(accessToken, refreshToken, profile, done) {
        db.users.find({ githubId: profile.username }, function (err, users) {
            if(err){
                return done(err);
            }
            if(users.length === 0){
                db.users.insert({ githubId: profile.username, displayName: profile.displayName }, function(err, doc){
                    if(err){
                        return done(err);
                    }
                    return done(null, doc);
                })
            } else {
                return done(null, users[0]);
            }
        });
    }
));

// dummy authenticate method
app.get('/auth/github',
    passport.authenticate('github', { session: false }));

// authentication done
app.get('/auth/github/callback',
    passport.authenticate('github', { session: false }),
    function (req, res) {
        // set session cookie that we can trust
        // TODO for extra security we can encrypt it with jsonwebtoken
        res.cookie(secureUserCookieName, req.user, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24});
        res.redirect(process.env.FRONT_END_URL);
    });


// ----------------- start server
console.log("starting server on ", process.env.PORT || 80);
server.listen(process.env.PORT || 80);
