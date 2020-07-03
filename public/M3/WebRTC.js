class WebRTC{
	constructor(){
		var configuration = {iceServers: 
				[{urls: "stun:stun.stunprotocol.org"},
				 {urls: "stun:stun.l.google.com:19302"},
				 {urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}		
				]};
		var dataChannel=null,iceCandidateList=[], ignoreOffer = false,isDisconnectByUser=false;
		var logger, makingOffer = false,myRollDiceResult=null;
		var pc=null,polite=false,prePolite=null,trackEventHandler,socket,statsID=null;
		this.call=(()=>{
			call();
		});
		this.hangUp=((isLocalDiscReq)=>{
			setDisconnectByUser(true);
			closeConnection();
			if (isLocalDiscReq) { //if it is local disconnect request.
				socket.emit("closeConnection",{});  //send the request to peer
			}
			iceCandidateList=[];
			/*
			if (statsID!=null) {
				clearInterval(statsID);
			}*/
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
		this.setTrackEvenHandlder=((handler)=>{
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
							logger("0 replace "+track.kind+" track");
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
			polite=false;
			makingOffer = false;
		}
		/**
		* The follow code work on chrome only;
		* firefox does not support RTCPeerConnection.connectionState attribute 
		**/
		function connectionStateChangeHandler(event) {
			logger("pc.connectionState="+pc.connectionState+","+isDisconnectByUser);
			/*
			switch(pc.connectionState) {
				case "closed":
					break;
				case "disconnected":
					pc.close();
					break;
				case "failed":
					// One or more transports has terminated unexpectedly or in an error
					//hangUp();
					
					if (isDisconnectByUser) {
						hangUp();
					} else {
						pc=null;
						if (polite) {
							call();
							logger("Making call again");
						}
					}
					break;
			}*/
		}
		function createConnection(){
			//if (pc==null){
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
			//}
			
			if (statsID==null){
				/*
				statsID=window.setInterval(function() {
				  pc.getStats(null).then(stats => {
					let statsOutput = "--------------------------------------------------------------------";

					stats.forEach(report => {
					  statsOutput += `<h2>Report: ${report.type}</h3>\n<strong>ID:</strong> ${report.id}<br>\n` +
									 `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;
					  
					  // Now the statistics for this report; we intentially drop the ones we
					  // sorted to the top above

					  Object.keys(report).forEach(statName => {
						if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
						  statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
						}
					  });
					  statsOutput+= "======================================================";
					  
					});

					logger(statsOutput);
				  });
				}, 10000);
				*/
			}
			iceCandidateList=[];
		}
		function dataChannelClose() {
			logger('Data channel closed');
			dataChannel.onopen = null;
			dataChannel.onmessage = null;
			dataChannel.onclose = null;
			dataChannel.onerror = null;
			dataChannel = null;
		}
		function dataChannelError(event) {
			logger('Data channel error:'+event.message);
		}
		function dataChannelOpen() {
		  logger('data channel is opened');
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
			logger('ice connection state: ' + pc.iceConnectionState+",pc.iceGatheringState="+pc.iceGatheringState);
			if ((pc.iceConnectionState === "disconnected") ||(pc.iceConnectionState==="failed")) {
				logger('0: Restart ICE');
				pc.restartIce();
			}
			/*
			switch (pc.iceConnectionState){
				case "connected":
					prePolite=null;
					logger("dataChannel.readyState="+((dataChannel)?dataChannel.readyState:"null"));
					logger("dataChannel.negotiated="+((dataChannel)?dataChannel.negotiated:"null"));
					break;
				case "disconnected":
				case "failed":
					if (!isDisconnectByUser){
						logger('ICE state change:Restart ICE');
						pc.restartIce();
					}
					break;
			}
			*/
			/*
			if ((pc.iceConnectionState=="disconnected") &&(!isDisconnectByUser)) {				
				
				if (polite){
					writeLog('ICE state change:Restart ICE');
					pc.restartIce();
				}
			}
			*/
			/*
			if (pc.iceConnectionState=="failed"){
				logger('Restart ICE');
				pc.restartIce();
			}
			if (pc.iceConnectionState=="disconnected") {
				hangUp();
			}				
			
			if ((pc.iceConnectionState=="disconnected") || (pc.iceConnectionState=="failed")){
				logger('Restart ICE');
				pc.restartIce();
			}
			*/
		}
		function iceGatheringStateChangeHandler() {
			logger("ICE Gathering State ="+pc.iceGatheringState+",pc.iceConnectionState="+pc.iceConnectionState);
		}
		async function negotiationEventHandler(){
			logger('Handle Negotiation');
			
			try {
				makingOffer = true;
				await pc.setLocalDescription();
				
				if (pc.localDescription){
					logger("0:ignoreOffer="+ignoreOffer+",makingOffer="+makingOffer+",pc.iceConnectionState="+pc.iceConnectionState+",pc.signalingState="+pc.signalingState+",polite="+polite);
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
					logger("Reconnect pc.iceGatheringState="+pc.iceGatheringState+",pc.iceConnectionState="+pc.iceConnectionState);
					if ((pc.iceGatheringState==="complete") && (pc.iceConnectionState==="failed")){
							logger('1: Restart ICE');
							pc.restartIce();
					}
					/*
					if (prePolite==null) {
						prePolite=polite;
					}
					if ((pc.iceGatheringState=="complete") && (pc.iceConnectionState=="disconnected")){
						closeConnection();
						if (prePolite)
							call();
					}*/
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
				logger("1:ignoreOffer="+ignoreOffer+",makingOffer="+makingOffer+",offerCollision="+offerCollision+",pc.iceConnectionState="+pc.iceConnectionState+",pc.signalingState="+pc.signalingState+",polite="+polite+",sdp.type="+sdp.type);
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