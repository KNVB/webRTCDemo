var fs = require('fs');
var https = require('https');

var express = require('express');
var app = express();
var http = require('http');
var { ExpressPeerServer } = require('peer');
var httpServerPort = 26;
var server = http.createServer(app);
var { v4: uuidV4 } = require('uuid')

var peerServer = ExpressPeerServer(server, {
  path: '/',
  proxied: true
});

var io = require('socket.io')(server);
app.set('view engine', 'ejs')
app.use(express.static('public'));
app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})
io.on('connection', socket => {
  socket.on('join-room', (roomId, userId) => {
	console.log("join room:",roomId, userId);	
    socket.join(roomId)
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})


server.listen(httpServerPort, function() {
  console.log('server up and running at %s port', httpServerPort);
});