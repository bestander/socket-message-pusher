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
// TODO key
app.use(cookieParser('optional secret string'));
// verify cookie
app.use('/api', function(req, res, next){
    console.log("/api call", req.cookies, req.signedCookies)
    var user = req.cookies[secureUserCookieName];
    console.log("got user from cookie", user)
    req.user = user;
    next();
});

var io = socketIo.listen(server);

db = new Datastore();

console.log("starting server on ", process.env.PORT || 80);
server.listen(process.env.PORT || 80);

// ------------ sending messages

io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function(room) {
        socket.join(room);
        // TODO find all queues for the room and send updates
//        socket.emit('message', data);
    });
});

function emitMessageFromQueue(company, room, queue) {
    // TODO get data by queue
//    var socketRoomName = company + '.' + room;
    // TODO get data from queue
//    var data = {};
    io.sockets.in(room).emit('message', data);
}

// -------------- managing queue

app.post('/api/queue', function (req, res) {
    // TODO authentication and company name
    var company = 'booktrack';
    var name = req.body.name;
    var website = req.body.website;
    db.insert({name: name, website: website, company: company, data: req.body.data});
    // TODO process nextTick
//    emitMessageFromQueue(company, website, name);
    io.sockets.in(company + '-' + website).emit('message', req.body.data);
    res.send("OK");
});

app.get('/api/queues', function (req, res) {
    console.log("/api/queues user", req.user)
    db.find({}, function(err, docs){
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
//        console.log("auth done", JSON.stringify(profile));
        done(null, {
            github_id: profile.username,
            displayName: profile.displayName
        });
        // TODO set internal user id
//        User.findOrCreate({ githubId: profile.id }, function (err, user) {
//            return done(err, user);
//        });
    }
));

// dummy authenticate method
app.get('/auth/github',
    passport.authenticate('github', { session: false }));

// authentication done
app.get('/auth/github/callback',
    passport.authenticate('github', { session: false }),
    function (req, res) {
        console.log("github callback", req.user);
        // set a signed cookie
        // TODO secure: true, httpOnly
        res.cookie(secureUserCookieName, req.user, {httpOnly: true, maxAge: 1000 * 60 * 60 * 24});
        res.redirect(process.env.FRONT_END_URL);
    });