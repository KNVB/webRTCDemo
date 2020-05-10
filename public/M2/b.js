var configuration = {iceServers: 
			[{urls: "stun:stun.stunprotocol.org"},
			 {urls: "stun:stun.l.google.com:19302"},
			 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
			]};
var isShareLocalVideo=false,isShareLocalVideo=false;			
var pc,dataChannel;
var socket = io();
var remoteICECandidateList=[];
var remoteView,remoteStream =new MediaStream();
$( document ).ready(function() {
	remoteView=document.getElementById("remoteView");
	remoteView.srcObject = remoteStream;
});
function addIceCandidate(iceCandidate) {
	writeLog(pc.currentRemoteDescription);
	pc.addIceCandidate(iceCandidate)
	//.then(()=>{writelog("1 ice candidate added")})
	.catch(e => {
		writeLog("Failure during addIceCandidate(): " + e);
	});
}
function chatlog(msg) {
  chatelement = document.getElementById('chatlog');
  chatelement.innerHTML += '<p>[' + new Date() + '] ' + msg + '</p>';
  chatelement.scrollTop = chatelement.scrollHeight
}
function clearLog() {
  chatelement = document.getElementById('logger');
  chatelement.innerHTML='';
}
function createConnection() {
	pc = new RTCPeerConnection(configuration);
	pc.onicecandidate = handleICECandidate;
	pc.onconnectionstatechange = handleconnectionstatechange;
	pc.oniceconnectionstatechange = handleiceconnectionstatechange;
	pc.ondatachannel = handleDataChannelEvent;
	pc.ontrack=handleRemoteTrack;
	dataChannel = pc.createDataChannel('chat');
	
}
function dataChannelClose() {
	writeLog('Data channel closed');
/*	
	document.getElementById('chatinput').disabled = true;
	document.getElementById('chatbutton').disabled = true;
*/	
}
function dataChannelError(event) {
	writeLog('Data channel error:'+event.message);
}
function dataChannelOpen() {
  writeLog('datachannelopen');
  chatlog('connected');
/* 
  console.log(remoteStream);
  document.getElementById('chatinput').disabled = false;
  document.getElementById('chatbutton').disabled = false;
*/  
}

function dataChannelMessage(message) {
	writeLog('Received Message from Data Channel:'+message.data);
	text = message.data;
	chatlog(text);
}
function enableShareAudio(v){
	isShareLocalAudio=v;
	if (pc!=null)
	{	
		pc.getSenders().forEach((sender)=>{
			var track=sender.track;
			if (track.kind=="audio")
				track.enabled=v;
		});
	}
}
function enableShareVideo(v){
	isShareLocalVideo=v;
	if (pc!=null)
	{	
		pc.getSenders().forEach((sender)=>{
			var track=sender.track;
			if (track.kind=="video")
				track.enabled=v;
		});
	}
}
function getConstraints() {
	/*
	return {"audio":true,
	"video":true}
	*/
	return {
			"audio":{
						channelCount: 2,
						echoCancellation:true,
						sampleSize: 16
					},
			"video":{
						width:{ min: 640, ideal: 1280, max: 1920 },
						height:{ min: 480, ideal: 720, max: 1080 }
					}
			}; 
}
async function getLocalMedia() {
	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia(getConstraints());
		document.getElementById("selfView").srcObject =stream;
		document.getElementById("selfView").play();
		stream.getTracks().forEach((track)=> {
				pc.addTrack(track.clone(),stream);	
				//writelog(track.kind);
			});
			
		/* use the stream */
	} catch(err) {
		writeLog("getLocalMedia failure:"+err);
	}
	finally {
		writeLog("getLocalMedia complete");
		return stream
	}
}
function handleconnectionstatechange(event) {
  writeLog("pc.connectionState="+pc.connectionState);
  switch(pc.connectionState) {
	case "disconnected":
    case "failed":
		// One or more transports has terminated unexpectedly or in an error
		hangUp();
		break;
    case "closed":
      
      break;
  }
}
function handleDataChannelEvent(event)
{
	writeLog('Data channel is created!');
	event.channel.onopen = dataChannelOpen;
	event.channel.onmessage = dataChannelMessage;
	event.channel.onclose = dataChannelClose;
	event.channel.onerror = dataChannelError;
}
function handleICECandidate(event) {
	if (event.candidate==null){
		writeLog("All ice candidate sent");
	} else {
		console.log("Send ICE Candidate");
		socket.emit('send_ice',event.candidate);
	}
}
function handleiceconnectionstatechange(event) {
  writeLog('ice connection state: ' + pc.iceConnectionState);
}
function handleRemoteTrack(event) {
	writeLog("Track event"); 
	remoteStream.addTrack(event.track, remoteStream);
}
function hangUp() {
	writeLog("Hang Up");
	var localStream=document.getElementById("selfView").srcObject;
	if (localStream) {
		localStream.getTracks()
		.forEach((track) => {
			track.stop();
			track.enabled = false; 
			localStream.removeTrack(track);
		});
		localStream=null;
		document.getElementById("selfView").src="";
		document.getElementById("selfView").srcObject=null;
	}
	if (remoteStream) {
		remoteStream.getTracks()
		.forEach((track) => {
			track.stop();
			remoteStream.removeTrack(track);
		});
		remoteView.src="";
	}		
	if (dataChannel) {
		dataChannel.onopen = null;
		dataChannel.onmessage = null;
		dataChannel.onclose = null;
		dataChannel.onerror = null;
		dataChannel.close();
	}
	dataChannel=null;
	
	if (pc) {
		pc.onicecandidate = null;
		pc.onconnectionstatechange = null;
		pc.oniceconnectionstatechange =null;
		pc.ondatachannel = null;
		pc.ontrack=null;
		pc.close();
	}
	pc=null;
}
async function makeACall() {
	clearLog();
	createConnection();
	await getLocalMedia();
	pc.createOffer(
		{offerToReceiveAudio: true,
		offerToReceiveVideo: true})
	.then((offer)=>
			{
				writeLog("Offer Have audio="+((offer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((offer.sdp.indexOf("video")>-1)?"yes":"no"));
				pc.setLocalDescription(offer)
				.then(()=> {
					writeLog("Set Local Description Success");
					socket.emit('send_offer',pc.localDescription);
					writeLog("Offer Sent");
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
async function receiveCall(offer) {
	writeLog("1 offer Have audio="+((offer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((offer.sdp.indexOf("video")>-1)?"yes":"no"));
	createConnection();
	await getLocalMedia();
	pc.setRemoteDescription(offer)
	.then(()=>{
		writeLog("1 Set Remote Description Success");
		pc.createAnswer()
		.then((answer)=>{
				writeLog("Create Answer success");
				writeLog("1 answer Have audio="+((answer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((answer.sdp.indexOf("video")>-1)?"yes":"no"));
				pc.setLocalDescription(answer)
				.then(()=> {
					writeLog("Set Local Description Success");
					socket.emit('send_answer',pc.localDescription);
					writeLog("Answer Sent");
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
	if (pc.currentLocalDescription==null) {
		remoteICECandidateList.push(iceCandidate);
	} else {
		if (remoteICECandidateList.length>0){
			remoteICECandidateList.forEach((candidate)=>{
				addIceCandidate(iceCandidate);
			});
			remoteICECandidateList=[];
		}	
		addIceCandidate(iceCandidate);	
	}

}
function sendMessage() {
	var inputBox=document.getElementById("chatinput");
	dataChannel.send(inputBox.value);
	chatlog(inputBox.value);
	inputBox.value="";
}
function writeLog(message){
	var logger=document.getElementById("logger");
	logger.innerHTML=message+"<br>"+logger.innerHTML;
}	