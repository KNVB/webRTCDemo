var app,express,http,httpServer,httpServerPort;
express = require('express');

app = express();
http = require('http');
httpServer= http.createServer(app);
httpServerPort=26;
var io = require('socket.io')(httpServer);
var peerBroker=require("./PeerBroker.js");
var userList=[];
app.use(express.static('public'));
peerBroker(io);
io.on('connection', (socket) => {
	console.log('a user('+socket.id+') connected@'+getTimeString());
	if (userList.length<2){
		userList.push(socket.id);
	} else {
		socket.emit('rejectConnection','');
		socket.disconnect(true);
	}
	console.log('User list='+JSON.stringify(userList)+'@'+getTimeString());
	socket.on("abc",()=>{
		console.log("ABC event");
	});
	socket.on("closeConnection",()=>{
		console.log("Close connection request received@"+getTimeString());
		socket.broadcast.emit("closeConnection", {});
	});
	socket.on('disconnect', () => {
		console.log('user ('+socket.id+') disconnected@'+getTimeString());
		console.log('Before '+JSON.stringify(userList));
		userList= userList.filter(function(value, index, arr){ return value !== socket.id;});
		console.log('After '+JSON.stringify(userList));
	});
});	
function getTimeString(){
	var date=new Date();
	var result=date.getHours()+":"+date.getMinutes() +":"+date.getSeconds()+"."+date.getMilliseconds();
	return result;
}
httpServer.listen(httpServerPort, function() {
  console.log('server up and running at %s port', httpServerPort);
});