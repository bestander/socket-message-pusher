var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var bodyParser = require('body-parser');

app.use(bodyParser());

server.listen(80);

app.post('/push', function (req, res) {
    io.sockets.emit('message',req.body);
    res.send("OK");
});

io.sockets.on('connection', function (socket) {
    socket.emit('message', "connected");
});