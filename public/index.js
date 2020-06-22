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

/*
var http = require('http');
var serverPort = 24;
server = http.createServer(app);
*/
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
	socket.on("send",(req)=>{
		console.log("Receive send request");
		socket.broadcast.emit("receive", req);
	});
	socket.on("sendRollDiceResult",(rollDiceResult)=>{
		socket.broadcast.emit("receiveRollDiceResult",rollDiceResult);
	});
	socket.on("requestRollDice",(rollDiceResult)=>{
		socket.broadcast.emit("requestRollDice",rollDiceResult);
	});
	socket.on('disconnect', () => {
		console.log('user disconnected@'+(new Date()));
	});
});

server.listen(serverPort, function() {
  console.log('server up and running at %s port', serverPort);
});