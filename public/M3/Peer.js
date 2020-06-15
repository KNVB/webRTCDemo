class Peer{
	constructor() {
		var configuration = {iceServers: 
				[{urls: "stun:stun.stunprotocol.org"},
				 {urls: "stun:stun.l.google.com:19302"},
				 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
				]};
		var dataChannel=null, ignoreOffer = false,makingOffer = false;
		var pc=null,polite=false,ontrackHandler,socket;
		var writeLog;
		this.addStream=((stream)=>{
			var senderList=pc.getSenders();
			senderList.forEach((sender)=>{
				pc.removeTrack(sender);
			});
			stream.getTracks().forEach((track)=>{
				pc.addTrack(track);
			});
			
		});
		this.call=(()=>{
			polite=true;
			createConnection();
		});
		this.hangUp=(()=>{
			hangUp();
		});
		this.receive=(async (req)=>{
			let ignoreOffer = false;
			if (pc==null)
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
				if (req.candidate){
					try {
						if (pc.currentRemoteDescription){
							await pc.addIceCandidate(req.candidate);
						}
					} catch(err) {
						if (!ignoreOffer) {
						  throw err;
						}
					}
				}
			}
		});
		this.setLogger=((wl)=>{
			writeLog=wl;
		});
		this.setOntrackHandler=((handler)=>{
			ontrackHandler=handler;
		});
		this.setSocket=((s)=>{
			socket=s;
		});
//===========================================================================
		function createConnection(){
			pc=new RTCPeerConnection(configuration);
			pc.onconnectionstatechange = handleConnectionStateChange;
			pc.ondatachannel = handleDataChannelEvent;
			pc.onicecandidate=iceCandidateEventHandler;
			pc.oniceconnectionstatechange = handleICEConnectionStateChange;
			pc.onicegatheringstatechange =handleICEGatheringStateChange;
			pc.onnegotiationneeded=negotiationEventHandler;
			pc.onsignalingstatechange=handleSignalingStateChange;
			pc.ontrack=ontrackHandler;
			
			dataChannel= pc.createDataChannel('chat');
			writeLog("createConnection:"+pc.currentRemoteDescription);
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
			/*
			text = message.data;
			chatlog(text);
			*/
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
		
		function handleSignalingStateChange(event) {
			writeLog("pc.signalingState="+pc.signalingState);
			if(pc.signalingState=="stable"){
				writeLog("ICE negotiation complete");
			}
		} 
		function hangUp() {
			if (dataChannel)
				dataChannel.close();
			if (pc){
				pc.close();
				pc.onconnectionstatechange = null;
				pc.ondatachannel = null;
				pc.onicecandidate=null;
				pc.oniceconnectionstatechange = null;
				pc.onicegatheringstatechange =null;
				pc.onnegotiationneeded=null;
				pc.onsignalingstatechange=null;
				pc.ontrack=null;
				pc=null;
			}
		}
		function iceCandidateEventHandler(event){
			if (event.candidate==null){
				writeLog("All ICE Candidates are sent");
			} else {
				writeLog("Send ICE Candidate");
				socket.emit('send',{candidate:event.candidate});
			}
		}
		async function negotiationEventHandler(){
			writeLog('Handle Negotitation');
			
			try {
				makingOffer = true;
				await pc.setLocalDescription();
				socket.emit("send",{ description: pc.localDescription });
			} catch(err) {
				writeLog(err);
			} finally {
				makingOffer = false;
			}
		}
	}
}