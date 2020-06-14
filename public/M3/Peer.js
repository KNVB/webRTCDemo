class Peer{
	constructor(cl,wl) {
		var configuration = {iceServers: 
			[{urls: "stun:stun.stunprotocol.org"},
			 {urls: "stun:stun.l.google.com:19302"},
			 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
			]};
		var polite=false;	
		var localVideo,remoteVideo;
		var dataChannel,pc,self=this,socket;	
		var makingOffer = false, ignoreOffer = false;
		var localVideo,remoteVideo;
		var offerParam={
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
				iceRestart: true
			};
		var clearLog=cl,writeLog=wl;
		var remoteICECandidateList=[];

		socket = io.connect();
		dataChannel=null;
		pc=null;
		this.addStream=((stream)=>{
			localVideo.srcObject =stream;
			stream.getTracks().forEach((track)=>{
				pc.addTrack(track,stream);
			});
		});
		this.call=(async ()=>{
			polite=true;
			clearLog();
			createConnection();
		});
		this.hangUp=(()=>{
			writeLog("Hang Up");
			polite=false;
			closeVideoStream(localVideo);
			closeVideoStream(remoteVideo);
			
			if (dataChannel) {
				dataChannel.close();
			}

			if (pc) {
				pc.close();
				handleClose();
			}
		});
		this.getLocalMedia=(async ()=>{
			return await getLocalMedia();
		});
		this.setLocalVideo=((lv)=>{
			localVideo=lv;
		});
		this.setRemoteVideo=((rv)=>{
			remoteVideo=rv;
		});
//==============================================================================================		
		function addIceCandidate(iceCandidate) {
			//writeLog(pc.currentRemoteDescription);
			pc.addIceCandidate(iceCandidate)
			.then(()=>{
				writeLog("1 ice candidate added")
			})
			.catch(e => {
				writeLog("Failure during addIceCandidate(): " + e);
			});
		}
		function closeVideoStream(v){
			writeLog("closeVideoStream:v="+v.id+",srcObject="+v.srcObject);
			if (v.srcObject!=null) {
				v.srcObject.getTracks().forEach((track)=>{
					writeLog("track.kind="+track.kind+" stop.");
					track.stop();
				});
				v.srcObject=null;
			}
		}
		function createConnection() {
			pc = new RTCPeerConnection(configuration);
			pc.onclose =handleClose; 
			pc.onconnectionstatechange = handleConnectionStateChange;
			pc.ondatachannel = handleDataChannelEvent;
			pc.onicecandidate = handleICECandidate;
			pc.oniceconnectionstatechange = handleICEConnectionStateChange;
			pc.onicegatheringstatechange =handleICEGatheringStateChange;
			pc.onnegotiationneeded = handleNegotiation;
			pc.ontrack=handleRemoteTrack;
			pc.onsignalingstatechange=handleSignalingStateChange;
			dataChannel = pc.createDataChannel('chat');
		}
		function dataChannelClose() {
			writeLog('Data channel closed');
			dataChannel.onopen = null;
			dataChannel.onmessage = null;
			dataChannel.onclose = null;
			dataChannel.onerror = null;
			dataChannel = null;
		}
		function dataChannelError(event) {
			writeLog('Data channel error:'+event.message);
		}
		function dataChannelOpen() {
		  writeLog('data channel is opened');
		}

		function dataChannelMessage(message) {
			writeLog('Received Message from Data Channel:'+message.data);
			text = message.data;
			chatlog(text);
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
				/* use the stream */
			} catch(err) {
				writeLog("getLocalMedia failure:"+err);
			}
			finally {
				writeLog("getLocalMedia complete");
				return stream
			}
		}		
		function handleClose() {
			writeLog("pc.connection is closed");
			pc.onclose = null;
			pc.onconnectionstatechange = null;
			pc.ondatachannel = null;
			pc.onicecandidate = null;
			pc.oniceconnectionstatechange = null;
			pc.onicegatheringstatechange =null;
			pc.onnegotiationneeded = null;
			pc.ontrack=null;
			pc.onsignalingstatechange=null;
			pc=null;			
		}
		function handleConnectionStateChange(event) {
		  writeLog("pc.connectionState="+pc.connectionState);
		  switch(pc.connectionState) {
			case "disconnected":
			case "failed":
				// One or more transports has terminated unexpectedly or in an error
				hangUp();
				break;
			case "closed":
				hangUp();
				break;
		  }
		}
		function handleDataChannelEvent(event){
			writeLog('Data channel is created!');
			event.channel.onopen = dataChannelOpen;
			event.channel.onmessage = dataChannelMessage;
			event.channel.onclose = dataChannelClose;
			event.channel.onerror = dataChannelError;
		}
		function handleICECandidate(event) {
			if (event.candidate==null){
				writeLog("All ICE Candidates are sent");
			} else {
				writeLog("Send ICE Candidate");
				//socket.emit('send',event.candidate);
			}
		}
		function handleICEConnectionStateChange(event) {
			writeLog('ice connection state: ' + pc.iceConnectionState);
			if (pc.iceConnectionState=="failed"){
				writeLog('Restart ICE');
				pc.restartIce();
			}
			if (pc.iceConnectionState=="disconnected") {
				hangUp();
			}				
			/*
			if ((pc.iceConnectionState=="disconnected") || (pc.iceConnectionState=="failed")){
				writeLog('Restart ICE');
				pc.restartIce();
			}
			*/
		}
		function handleICEGatheringStateChange() {
			writeLog("ICE Gathering State ="+pc.iceGatheringState);
		}	
		async function handleNegotiation(event) {
			writeLog('Handle Negotitation');
			try {
				makingOffer = true;
				await pc.setLocalDescription();
				socket.emit("send",{ description: pc.localDescription });
			  } catch(err) {
				console.error(err);
			  } finally {
				makingOffer = false;
			  }
			
		}	
		function handleRemoteTrack(event) {
			writeLog("Track event:"+event.track.kind); 
			var remoteStream;
			if (remoteVideo.srcObject==null){
				remoteView.srcObject=new MediaStream();
			}
			remoteStream=remoteVideo.srcObject;
			remoteStream.addTrack(event.track, remoteStream);
		}
		function handleSignalingStateChange(event) {
			writeLog("pc.signalingState="+pc.signalingState);
			if(pc.signalingState=="stable"){
				writeLog("ICE negotiation complete");
			}
		}

//============================================================================================================
		socket.on("receive",async (req)=>{
			let ignoreOffer = false;
			clearLog();
			createConnection();
			if (req.description){
				const offerCollision = (req.description.type == "offer") &&
							 (makingOffer || pc.signalingState != "stable");

				ignoreOffer = !polite && offerCollision;
				if (ignoreOffer) {
					return;
				}
				await pc.setRemoteDescription(req.description);
				if (req.description.type =="offer") {
					await pc.setLocalDescription();
					socket.emit("send",{description: pc.localDescription});
				}
			} else {
				try {
					await pc.addIceCandidate(req);
				} catch(err) {
					if (!ignoreOffer) {
					  throw err;
					}
				}
			}
		});
	}
}