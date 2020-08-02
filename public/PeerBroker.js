module.exports=function(io){
	io.on('connection', (socket) => {
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
	});
	function getTimeString(){
		var date=new Date();
		var result=date.getHours()+":"+date.getMinutes() +":"+date.getSeconds()+"."+date.getMilliseconds();
		return result;
	}
}