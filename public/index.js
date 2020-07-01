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
  console.log('new connection@'+getTimeString());
  userList.push(socket.id);	
  socket.emit('message', 'This is a message from the dark side.');
});
io.on('connection', (socket) => {
	console.log('a user connected@'+getTimeString());
	socket.on("closeConnection",()=>{
		console.log("Close connection request received@"+getTimeString());
		socket.broadcast.emit("closeConnection", {});
	});
	socket.on("send",(req)=>{
		socket.broadcast.emit("receive", req);
	});
	socket.on("sendICECandidate",(req)=>{
		console.log("Receive an send ICE Candidate request@"+getTimeString());
		socket.broadcast.emit("receiveICECandidate", req);
	});
	socket.on("sendRollDiceResult",(rollDiceResult)=>{
		socket.broadcast.emit("receiveRollDiceResult",rollDiceResult);
	});
	socket.on("sendSDP",(sdp)=>{
		console.log("Receive an send description request@"+getTimeString());
		socket.broadcast.emit("receiveSDP", sdp);
	});
	socket.on("requestRollDice",(rollDiceResult)=>{
		socket.broadcast.emit("requestRollDice",rollDiceResult);
	});
	socket.on('disconnect', () => {
		console.log('user disconnected@'+getTimeString());
	});
});

server.listen(serverPort, function() {
  console.log('server up and running at %s port', serverPort);
});

function getTimeString(){
	var date=new Date();
	var result=date.getHours()+":"+date.getMinutes() +":"+date.getSeconds()+"."+date.getMilliseconds();
	return result;
}