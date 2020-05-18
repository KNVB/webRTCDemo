class WebRTC{
	constructor(cl,wl) {
			
		var configuration = {iceServers: 
			[{urls: "stun:stun.stunprotocol.org"},
			 {urls: "stun:stun.l.google.com:19302"},
			 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
			]};
		var localVideo,remoteVideo;
		var dataChannel,pc,socket;
		var isCaller=0;
		var offerParam={
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
				iceRestart: true
			};
		var restartICEParam={
				offerToReceiveAudio: true,
				offerToReceiveVideo: true,
				iceRestart: true
			};	
		var remoteICECandidateList=[];
		var clearLog=cl,writeLog=wl;
		socket = io.connect();
		dataChannel=null;
		pc=null;
		this.call=(async ()=>{
			isCaller=2;
			clearLog();
			createConnection();
			await getLocalMedia();
			//createOffer();				
		});
		this.hangUp=(()=>{
			writeLog("Hang Up");
			closeVideoStream(localVideo);
			closeVideoStream(remoteVideo);
			if (dataChannel) {
				dataChannel.close();
			}

			if (pc) {
				pc.close();
			}
		});
		this.setLocalVideo=((lv)=>{
			localVideo=lv;
		});
		this.setRemoteVideo=((rv)=>{
			remoteVideo=rv;
		});
		socket.on("receive_answer",function (answer) {
			writeLog("receive an answer");
			writeLog("0 answer Have audio="+((answer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((answer.sdp.indexOf("video")>-1)?"yes":"no"));
			receiveAnswer(answer);
		});
		socket.on("receive_iceCandidate",function (iceCandidate) {
			writeLog("receive ice candidate");
			receiveICECandidate(iceCandidate);
		});
		socket.on("receive_offer",function (offer) {
			writeLog("receive an offer");
			receiveCall(offer);
		});
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
			var stream=v.srcObject;
			if (stream) {
				stream.getTracks()
				.forEach((track) => {
					track.stop();
					track.enabled = false; 
					stream.removeTrack(track);
				});
				stream=null;
				v.src="";
				v.srcObject=null;
			}		
		}
		function createOffer(){
			pc.createOffer(offerParam)
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
				localVideo.srcObject =stream;
				localVideo.play();
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
				socket.emit('send_ice',event.candidate);
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
		function handleNegotiation(event) {
			writeLog('Handle Negotitation');
			if (isCaller==2) {
				createOffer();
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
		function receiveAnswer(answer) {
			pc.setRemoteDescription(answer)
			.then(()=>
				{
					writeLog("1 Set Remote Description Success");
				})
			.catch((error)=>
				{
					writeLog("1 Set Remote Description Failure:"+error);
				});
		}
		
		async function receiveCall(offer) {
			isCaller=1;
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
	}
}