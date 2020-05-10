class WebRTC
{
	constructor(p) {
		
		let configuration = {iceServers: [
			{urls: "stun:stun.stunprotocol.org"},
			{urls: "stun:stun.l.google.com:19302"},
			{urls: "turn:numb.viagenie.ca", credential: "turnserver", username: "sj0016092@gmail.com"}			
		]};
			
		let dataChannel = null;

		let localVideoTag=null;
		let pc=null;
		let parameters=p;
		let remoteStream=null;
		let remoteVideoTag=null;
		this.closeConnection=(()=>{
			if (dataChannel!=null) {
				dataChannel.close();
				dataChannel=null;
			}
			if (pc!=null) {
				pc.close();
				pc=null;
			}
		});
		this.createAnswer=((offer,isShareLocalAudio,isShareLocalVideo)=>{
			 pc.setRemoteDescription(offer)
			 .then(()=>{
					if (parameters.setRemoteDescriptionSuccess!=undefined)
						parameters.setRemoteDescriptionSuccess();
					prepareLocalMedia(this,genAnswer,isShareLocalAudio,isShareLocalVideo);
				})
			 .catch((error)=>{
					if (parameters.setRemoteDescriptionFailed!==undefined)
						parameters.setRemoteDescriptionFailed(error);
				});
		});
		this.createConnection=(()=>{
			pc = new RTCPeerConnection(configuration);
	
			
			pc.onicecandidate=handleicecandidate;						
			pc.ontrack = handleRemoteTrack;
			
			if (parameters.connectionStateChangeHandler!==undefined)
				pc.onconnectionstatechange = parameters.connectionStateChangeHandler;
			
			if (parameters.iceConnectionStatechangeHandler!==undefined)
				pc.oniceconnectionstatechange = parameters.iceConnectionStatechangeHandler;
			
			
			dataChannel = pc.createDataChannel(parameters.dataChannelLabel,parameters.dataChannelOptions);
			
			if (parameters.dataChannelOpenHandler!==undefined)
				dataChannel.onopen = parameters.dataChannelOpenHandler;
			
			if (parameters.dataChannelMessageHandler!==undefined)
				dataChannel.onmessage = parameters.dataChannelMessageHandler;
		
		});
		
		this.createOffer=((isShareLocalAudio,isShareLocalVideo)=> {
			prepareLocalMedia(this,genOffer,isShareLocalAudio,isShareLocalVideo);
		});
		this.enableShareAudio=((v)=>{
			if (pc==null)
			{	
				isShareLocalAudio=v;
				console.log("enableShareAudio:pc is null");
			}
			else 
			{	
				pc.getSenders().forEach((sender)=>{
					var track=sender.track;
					if (track.kind=="audio")
						track.enabled=v;
				});
			}
		});
		this.enableShareVideo=((v)=>{
			if (pc==null)
				isShareLocalVideo=v;
			else	
			{	
				pc.getSenders().forEach((sender)=>{
					var track=sender.track;
					if (track.kind=="video")
						track.enabled=v;
				});
			}
		});
		this.sendMessage=((data)=>{
			dataChannel.send(data);
		});
		this.setAnswer=((answer)=>{
			pc.setRemoteDescription(answer)
			.then(()=>{	
				if (parameters.setRemoteDescriptionSuccess!==undefined)
					parameters.setRemoteDescriptionSuccess();
			})	
			.catch((error)=>{	
				if (parameters.setRemoteDescriptionFailed!==undefined)
					parameters.setRemoteDescriptionFailed(error);
			});
		});
		this.setLocalVideoTag=((l)=>{
			localVideoTag=l;
		});
		this.setRemoteVideoTag=((r)=>{
			remoteVideoTag=r;
		});
		
		function getConstraints() {
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
		function genAnswer() {
			console.log("genAnswer():"+JSON.stringify(pc.getSenders()));
			pc.createAnswer()
			.then((answer)=>{
				
				if (parameters.createAnswerSuccessHandler!==undefined)
					parameters.createAnswerSuccessHandler();
				pc.setLocalDescription(answer)
				.then(()=>
					{
						if (parameters.setLocalDescriptionSuccess!==undefined)
							parameters.setLocalDescriptionSuccess
					})
				.catch((error)=>
					{
						if (parameters.setLocalDescriptionFailed!==undefined);
							parameters.setLocalDescriptionFailed(error);
					});
				console.log("createAnswer="+JSON.stringify(answer));
			}) 
			.catch((error) =>{
				if (parameters.createAnswerFailHandler!==undefined)
					parameters.createAnswerFailHandler(error);
			});		
		}
		function genOffer() {
			console.log("genOffer():"+JSON.stringify(pc.getSenders()));
			pc.createOffer()
			.then((offer)=>{
				if (parameters.createOfferSuccessHandler!==undefined)
					parameters.createOfferSuccessHandler();
				pc.setLocalDescription(offer)
				.then(()=>
					{
						if (parameters.setLocalDescriptionSuccess!==undefined)
							parameters.setLocalDescriptionSuccess();
					})
				.catch((error)=>
					{
						if (parameters.setLocalDescriptionFailed!==undefined)
							parameters.setLocalDescriptionFailed(error);
						//console.log("createOffer="+JSON.stringify(offer));
					});
			})
			.catch((error)=>{
				if (parameters.createOfferFailHandler!==undefined)
					parameters.createOfferFailHandler(error);
			});
		}
		function hasGetUserMedia() {
			return !!(navigator.mediaDevices &&
				navigator.mediaDevices.getUserMedia);
		}
		function handleicecandidate(event){
			if (event.candidate==null){
				if (parameters.iceCandidateHandler!==undefined)
					parameters.iceCandidateHandler(pc.localDescription);
			}	
		}
		function handleRemoteTrack(event) {
			console.log("Track event"); 
			if (remoteVideoTag!=null) {
				if (remoteStream==null){
					remoteStream =new MediaStream();
					remoteVideoTag.srcObject=remoteStream;
				}
				remoteStream.addTrack(event.track);
			}
		}
		function prepareLocalMedia(webrtc,postAction,isShareLocalAudio,isShareLocalVideo) {
			if (hasGetUserMedia() && (localVideoTag!=null)) {
				navigator.mediaDevices.getUserMedia(getConstraints())
					.then((stream) => 
						{
							localVideoTag.srcObject = stream;
							localVideoTag.play();
							stream.getTracks().forEach((track)=> {
								pc.addTrack(track.clone());	
								//console.log(track);
							});
							
							webrtc.enableShareAudio(isShareLocalAudio);
							webrtc.enableShareVideo(isShareLocalVideo);
							postAction();
						})
					.catch((error)=> 
						{
							console.log("Getting Media failure:"+error);
							postAction();
						});
				
			} else {
				postAction();
			}
		}			
	}
}