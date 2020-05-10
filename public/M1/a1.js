var configuration = {iceServers: 
			[{urls: "stun:stun.stunprotocol.org"},
			]};
var pc,dataChannel;
var socket = io();

function chatlog(msg) {
  chatelement = document.getElementById('chatlog');
  chatelement.innerHTML += '<p>[' + new Date() + '] ' + msg + '</p>';
  chatelement.scrollTop = chatelement.scrollHeight
}
function createConnection(x) {
	pc = new RTCPeerConnection(configuration);
	pc.onicecandidate = x;
	pc.onconnectionstatechange = handleconnectionstatechange;
	pc.oniceconnectionstatechange = handleiceconnectionstatechange;
	pc.ondatachannel = handleDataChannelEvent;
  
	dataChannel = pc.createDataChannel('chat');
	
}
function handleDataChannelEvent(event)
{
	writeLog('Data channel is created!');
	event.channel.onopen = dataChannelOpen;
	event.channel.onmessage = dataChannelMessage;
	event.channel.onclose = dataChannelClose;
	event.channel.onerror = dataChannelError;
}
function dataChannelClose() {
	writeLog('Data channel closed');
	document.getElementById('chatinput').disabled = true;
	document.getElementById('chatbutton').disabled = true;
}
function dataChannelError(event) {
	writeLog('Data channel error:'+event.message);
}
function dataChannelOpen() {
  writeLog('datachannelopen');
  chatlog('connected');
  document.getElementById('chatinput').disabled = false;
  document.getElementById('chatbutton').disabled = false;
}

function dataChannelMessage(message) {
	writeLog('Received Message from Data Channel'+message.data);
	text = message.data;
	chatlog(text);
}
function handleconnectionstatechange(event) {
  writeLog("pc.connectionState="+pc.connectionState);
}
function handleiceconnectionstatechange(event) {
  writeLog('ice connection state: ' + pc.iceConnectionState);
}
function hangUp() {
	dataChannel.close();
	dataChannel=null;
	pc.close();
	pc=null;
}
function makeACall() {
	createConnection(sendOffer);
	pc.createOffer()
	.then((offer)=>
			{
				pc.setLocalDescription(offer)
				.then(()=> {
					writeLog("Set Local Description Success");
				})
				.catch((error)=>{
					writeLog("Set Local Description Failure:"+error);
				});
			})
	.catch ((error)=>{
		writeLog("Create Offer Failure:"+error);
	});		
}
function receiveAnswer(answer) {
	pc.setRemoteDescription(answer)
	.then(()=>
		{
			writeLog("1 Set Remote Description Success");
			writeLog(pc.signalingState);
		})
	.catch((error)=>
		{
			writeLog("1 Set Remote Description Failure:"+error);
		});
}
function receiveCall(offer) {
	createConnection(sendAnswer);
	pc.setRemoteDescription(offer)
	.then(()=>{
		writeLog("1 Set Remote Description Success");
		pc.createAnswer()
		.then((answer)=>{
				writeLog("Create Answer success");
				pc.setLocalDescription(answer)
				.then(()=> {
					writeLog("Set Local Description Success");
					/*
					socket.emit('send_answer',pc.localDescription);
					writeLog("Answer Sent");
					*/
				})
				.catch((error)=>{
					writeLog("Set Local Description Failure:"+error);
				});
		})
		.catch ((error)=>{
			writeLog("Create Answer Failure:"+error);
		});	
	})
	.catch ((error)=>{
		writeLog("1 Set Remote Description Failure:"+error);
	});
}
function receiveICECandidate(iceCandidate){
	pc.addIceCandidate(iceCandidate)
	//.then(()=>{writelog("1 ice candidate added")})
	.catch(e => {
		writeLog("Failure during addIceCandidate(): " + e);
	});
	writeLog(pc.signalingState);
}
function sendAnswer(event) {
	if (event.candidate==null){
		socket.emit('send_answer',pc.localDescription);
		writeLog("Answer Sent");
	}
}
function sendMessage() {
	var inputBox=document.getElementById("chatinput");
	dataChannel.send(inputBox.value);
	chatlog(inputBox.value);
	inputBox.value="";
}
function sendOffer(event) {
	if (event.candidate==null){
		socket.emit('send_offer',pc.localDescription);
		writeLog("Offer Sent");
	} 
}
function writeLog(message){
	var logger=document.getElementById("logger");
	logger.innerHTML+=message+"<br>";
}	