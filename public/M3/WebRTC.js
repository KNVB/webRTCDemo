class WebRTC{
	constructor(){
		var configuration = {iceServers: 
				[{urls: "stun:stun.stunprotocol.org"},
				 {urls: "stun:stun.l.google.com:19302"},
				 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
				]};
		var channelEventHandler;
		var dataChannel=null,iceCandidateList=[], ignoreOffer = false,isDisconnectByUser=false;
		var logger, makingOffer = false,myRollDiceResult=null;
		var pc=null,polite=false,prePolite=null,trackEventHandler,socket;
		this.call=(()=>{
			call();
		});
		this.setChannelEventHandler=((handler)=>{
			channelEventHandler=handler;
		});
		this.hangUp=((isLocalDiscReq)=>{
			setDisconnectByUser(true);
			closeConnection();
			if (isLocalDiscReq) { //if it is local disconnect request.
				socket.emit("closeConnection",{});  //send the request to peer
			}
			iceCandidateList=[];
		});
		
		this.setDisconnectByUser=((b)=>{
			setDisconnectByUser(b);
		});	
		this.setLogger=((wl)=>{
			logger=wl;
		});
		this.setSocket=((s)=>{
			setSocket(s);
		});
		this.setTrackEventHandlder=((handler)=>{
			trackEventHandler=handler;
		});
		this.setupStream=((stream)=>{
			if (pc){
				var senders=pc.getSenders();
				if (senders.length<1) {
					stream.getTracks().forEach((track)=>{
						logger("0 add "+track.kind+" track");
						pc.addTrack(track,stream);
					});
				} else {
					senders.forEach((sender)=>{
						if (sender.track)
							sender.track.stop();
					});
					stream.getTracks().forEach((track)=>{
						var sender = pc.getSenders().find(function(s) {
							if (s.track)
								return s.track.kind == track.kind;
							else 
								return null;
						});
						if (sender==null) {
							logger("1 add "+track.kind+" track");
							pc.addTrack(track,stream);
						} else {
							logger("Replace "+track.kind+" track");
							sender.replaceTrack(track);
						}
					});
				}
			}
		});
//==========================================================================================================				
		function closeConnection() {
			if (dataChannel)
				dataChannel.close();
			if (pc){
				pc.onconnectionstatechange = null;
				pc.ondatachannel = null;
				pc.onicecandidate=null;
				pc.oniceconnectionstatechange = null;
				pc.onicegatheringstatechange =null;
				pc.onnegotiationneeded=null;
				pc.onsignalingstatechange=null;
				pc.ontrack=null;
				pc.close();
				pc=null;
			}
			polite=false;
			makingOffer = false;
		}
		/**
		* The follow code work on chrome only;
		* firefox does not support RTCPeerConnection.connectionState attribute 
		**/
		function connectionStateChangeHandler(event) {
			logger("pc.connectionState="+pc.connectionState+"<br>isDisconnectByUser="+isDisconnectByUser);
			channelEventHandler(pc.connectionState);
			if (pc.connectionState==="failed") {
				logger('-1: Restart ICE');
				pc.restartIce();
			}
		}
		function createConnection(){
			pc=new RTCPeerConnection(configuration);
			pc.onconnectionstatechange = connectionStateChangeHandler;
			pc.ondatachannel = dataChannelEventHandler;
			pc.onicecandidate=iceCandidateEventHandler;
			pc.oniceconnectionstatechange = iceConnectionStateChangeHandler;
			pc.onicegatheringstatechange =iceGatheringStateChangeHandler;
			pc.onnegotiationneeded=negotiationEventHandler;
			pc.onsignalingstatechange=signalingStateChangeHandler;
			pc.ontrack=trackEventHandler;
			
			dataChannel= pc.createDataChannel('chat');
			logger("createConnection:"+pc.currentRemoteDescription);
			
			iceCandidateList=[];
		}
		function dataChannelClose() {
			logger('Data channel closed');
			channelEventHandler('closed');
			if (isDisconnectByUser){
				dataChannel.onopen = null;
				dataChannel.onmessage = null;
				dataChannel.onclose = null;
				dataChannel.onerror = null;
				dataChannel = null;
			}
		}
		function dataChannelError(event) {
			logger('Data channel error:'+event.message);
		}
		function dataChannelOpen() {
		  logger('data channel is opened');
		  channelEventHandler("opened");
		}
		function dataChannelMessage(message) {
			logger('Received Message from Data Channel:'+message.data);
			text = message.data;
			chatlog(text);
		}
		function dataChannelEventHandler(event){
			logger('Data channel is created!');
			event.channel.onopen = dataChannelOpen;
			event.channel.onmessage = dataChannelMessage;
			event.channel.onclose = dataChannelClose;
			event.channel.onerror = dataChannelError;
		}
		function iceCandidateEventHandler(event){
			if (event.candidate==null){
				logger("All ICE Candidates are sent");
			} else {
				logger("Send an ICE Candidate");
				socket.emit("sendICECandidate",event.candidate);
			}
		}

		function iceConnectionStateChangeHandler(event) {
			logger('ice connection state: ' + pc.iceConnectionState+"<br>pc.iceGatheringState="+pc.iceGatheringState);
			channelEventHandler(pc.iceConnectionState);
			if (pc.iceConnectionState==="failed") {	
				logger('0: Restart ICE');
				pc.restartIce();
			}else {
				if ((pc.iceConnectionState === "connected") && (dataChannel.readyState==="closed")){
					dataChannel= pc.createDataChannel('chat');
					logger('Recreate Data Channel');
					/*
					logger("0 dataChannel.readyState="+((dataChannel)?dataChannel.readyState:"null"));
					logger("0 dataChannel.negotiated="+((dataChannel)?dataChannel.negotiated:"null"));
					*/
				}
			}
		}
		function iceGatheringStateChangeHandler() {
			logger("ICE Gathering State ="+pc.iceGatheringState+"<br>pc.iceConnectionState="+pc.iceConnectionState);
			if ((pc.iceGatheringState==="complete") && (pc.iceConnectionState==="failed")){
				logger('0.5: Restart ICE');
				pc.restartIce();
			}
		}
		async function negotiationEventHandler(){
			logger('Handle Negotiation');
			
			try {
				makingOffer = true;
				await pc.setLocalDescription();
				
				if (pc.localDescription){
					logger("0:ignoreOffer="+ignoreOffer+"<br>makingOffer="+makingOffer+"<br>pc.iceConnectionState="+pc.iceConnectionState+",pc.signalingState="+pc.signalingState+",polite="+polite);
					socket.emit("sendSDP",pc.localDescription);
				}
			} catch(err) {
				logger(err);
			} finally {
				makingOffer = false;
			}
		}
		function signalingStateChangeHandler(event) {
			logger("pc.signalingState="+pc.signalingState);
			switch (pc.signalingState){
				case "stable":
					logger("ICE negotiation complete");
					break;
			}
		}
//==========================================================================================================				
		async function addAllICECandidate(){
			for (var i=0;i<iceCandidateList.length;i++){
				await pc.addIceCandidate(iceCandidateList[i]);
			}
			iceCandidateList=[];
		}
		function call(){
			setDisconnectByUser(false);
			myRollDiceResult=getRandomNum();
			socket.emit("requestRollDice",myRollDiceResult);
		}
		function getRandomNum(){
			return (Math.round(Math.random() * 1000));
		}
		function setPolite(peerRollDiceResult) {
			if (myRollDiceResult==peerRollDiceResult) {
				logger("Because myRollDiceResult=peerRollDiceResult execute Call function again");
				call();
			} else{
				if (myRollDiceResult>peerRollDiceResult) {
					polite=false;
				} else {
					polite=true;
				}
				logger("myRollDiceResult="+myRollDiceResult+",peerRollDiceResult="+peerRollDiceResult+",polite="+polite);
				createConnection();
			}				
		}		
//==========================================================================================================		
		function setSocket(s){
			socket=s;
			socket.on("receiveICECandidate",async (iceCandidate)=>{
				try {
					logger("Received an ICE Candidate:"+(pc.currentRemoteDescription==null))
					if (pc.currentRemoteDescription){
						await pc.addIceCandidate(iceCandidate);
						addAllICECandidate();
					} else {
						iceCandidateList.push(iceCandidate);
					}
				} catch(err) {
					if (!ignoreOffer) {
					  throw err;
					}
				}
			});
			socket.on("receiveRollDiceResult",(peerRollDiceResult)=>{
				logger("receiveRollDiceResult");
				setPolite(peerRollDiceResult);
			});
			socket.on("reconnect",()=>{
				if (pc==null){
					logger("Reconnect");
				}else{
					logger("Reconnect pc.iceGatheringState="+pc.iceGatheringState+"<br>pc.iceConnectionState="+pc.iceConnectionState);
					if ((pc.iceGatheringState==="complete") && (pc.iceConnectionState==="disconnected")){
						logger('1: Restart ICE');
						pc.restartIce();
					}
				}
			});
			socket.on("requestRollDice",(peerRollDiceResult)=>{
				logger("receive roll Dice");
				myRollDiceResult=getRandomNum();
				socket.emit("sendRollDiceResult",myRollDiceResult);
				setPolite(peerRollDiceResult);
			});
			socket.on("receiveSDP",async (sdp)=>{
				logger("receive SDP");
				ignoreOffer = false;
				const offerCollision = (sdp.type == "offer") &&
								 (makingOffer || pc.signalingState != "stable");
				

				ignoreOffer = !polite && offerCollision;
				if (pc){
					logger("1:ignoreOffer="+ignoreOffer+",makingOffer="+makingOffer+",offerCollision="+offerCollision+"<br>pc.iceConnectionState="+pc.iceConnectionState+",pc.signalingState="+pc.signalingState+",polite="+polite+",sdp.type="+sdp.type);
				}else{ 
					logger("pc=null");
				}
				if (ignoreOffer) {
					return;
				}
				try{
					await pc.setRemoteDescription(sdp);
					addAllICECandidate();
				}catch (error){
					logger("Failed to setRemoteDescription :"+error+","+JSON.stringify(sdp));
				}
				if (sdp.type =="offer") {
					try{
						await pc.setLocalDescription();
						socket.emit("sendSDP",pc.localDescription);
						logger("1 sendSDP "+(pc.localDescription==null));
					}catch(error){
						logger("Failed to setLocalDescription :"+error);
					}
				}
			});
		}
		function setDisconnectByUser(b){ 
			isDisconnectByUser=b;		
		}
	}
	
}