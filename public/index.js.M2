var fs = require('fs');
var https = require('https');

var express = require('express');
var app = express();

var options = {
  key: fs.readFileSync('.well-known\\acme-challenge\\private.key'),
  ca: [fs.readFileSync('.well-known\\acme-challenge\\ca_bundle.crt')],
  cert: fs.readFileSync('.well-known\\acme-challenge\\certificate.crt')
};
var serverPort = 443;

var server = https.createServer(options, app);
var io = require('socket.io')(server);
var userList=[];

app.use(express.static('public'));
io.on('connection', function(socket) {
  console.log('new connection');
  userList.push(socket.id);	
  socket.emit('message', 'This is a message from the dark side.');
});
io.on('connection', (socket) => {
	console.log('a user connected@'+(new Date()));
	socket.on('chat message', (msg) => {
		io.emit('chat message', msg);
	});
	socket.on("send_answer", (answer) =>{
		console.log("receive an answer:"+answer+"@"+(new Date()));
		socket.broadcast.emit("receive_answer",answer);
	});
	socket.on("send_ice", (iceCandidate) =>{
		console.log("receive an ICE candidate:"+iceCandidate);
		userList.forEach((socketId) =>{
			console.log(socket.id,socketId);
			if (socket.id!=socketId)
				io.to(socketId).emit("receive_iceCandidate",iceCandidate);
		});
	  //socket.broadcast.emit("receive_iceCandidate",iceCandidate);
	});
	socket.on("send_offer", (offer) =>{
		console.log("receive an offer:"+offer+"@"+(new Date()));
		userList.forEach((socketId) =>{
			console.log(socket.id,socketId);
			if (socket.id!=socketId)
				io.to(socketId).emit("receive_offer",offer);
		});
	  //socket.broadcast.emit("receive_offer",offer);
	});  
	socket.on('disconnect', () => {
		console.log('user disconnected@'+(new Date()));
	});
});

server.listen(serverPort, function() {
  console.log('server up and running at %s port', serverPort);
});