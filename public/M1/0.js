var configuration = {iceServers: 
			[{urls: "stun:stun.stunprotocol.org"},
			]};
var pc,dataChannel;
var socket = io();
var remoteICECandidateList=[];
var remoteView,remoteStream =new MediaStream();
$( document ).ready(function() {
	remoteView=document.getElementById("remoteView");
	remoteView.srcObject = remoteStream;
});
function chatlog(msg) {
  chatelement = document.getElementById('chatlog');
  chatelement.innerHTML += '<p>[' + new Date() + '] ' + msg + '</p>';
  chatelement.scrollTop = chatelement.scrollHeight
}
function createConnection() {
	pc = new RTCPeerConnection(configuration);
	pc.onicecandidate = handleICECandidate;
	pc.onconnectionstatechange = handleconnectionstatechange;
	pc.oniceconnectionstatechange = handleiceconnectionstatechange;
	pc.ondatachannel = handleDataChannelEvent;
	dataChannel = pc.createDataChannel('chat');
}
function dataChannelClose() {
	writeLog('Data channel closed');
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
	writeLog('Received Message from Data Channel'+message);
	text = message.data;
	chatlog(text);
}
function handleconnectionstatechange(event) {
  writeLog("pc.connectionState="+pc.connectionState);
}
function handleDataChannelEvent(event)
{
	writeLog('Data channel is created!');
	event.channel.onopen = dataChannelOpen;
	event.channel.onmessage = dataChannelMessage;
	event.channel.onclose = dataChannelClose;
	event.channel.onerror = dataChannelError;
}
function handleiceconnectionstatechange(event) {
  writeLog('ice connection state: ' + pc.iceConnectionState);
}
function getConstraints() {
	return {"audio":true,
	"video":true}
	/*
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
	*/		
}
async function getLocalMedia() {
	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia(getConstraints());
		document.getElementById("selfView").srcObject =stream;
		document.getElementById("selfView").play();
		stream.getTracks().forEach((track)=> {
				pc.addTrack(track,stream);	
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
async function makeACall() {
	createConnection();
	await getLocalMedia();
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
function receiveAnswer(answer){
	pc.setRemoteDescription(answer)
	.then(()=>{
		writeLog("1 Set Remote Description Success");
	})
	.catch ((error)=>{
		writeLog("1 Set Remote Description Failure:"+error);
	});
}
async function receiveCall(offer) {
	createConnection();
	await getLocalMedia();
	pc.setRemoteDescription(offer)
	.then(()=>{
		writeLog("1 Set Remote Description Success");
		pc.createAnswer()
		.then((answer)=>{
				writeLog("Create Answer success");
				pc.setLocalDescription(answer)
				.then(()=> {
					writeLog("Set Local Description Success");
					
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
function sendMessage() {
	var inputBox=document.getElementById("chatinput");
	dataChannel.send(inputBox.value);
	chatlog(inputBox.value);
	inputBox.value="";
}
function writeLog(message){
	var logger=document.getElementById("logger");
	logger.innerHTML+=message+"<br>";
}	