var express = require('express');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var socketIo = require('socket.io');
var cors = require('cors');

var app = express();
var server = require('http').createServer(app);
app.use(cors());
app.use(bodyParser());
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

app.post('/queue', function (req, res) {
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

app.get('/queues', function (req, res) {
    db.find({}, function(err, docs){
        res.send(docs);
    });
});

//app.delete('/queue', function (req, res) {
//
//});

// --------------- registration

// TODO https://github.com/jaredhanson/passport-github
