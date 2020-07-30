<html>
	<head>
		<meta charset="UTF-8">
		<title>WebRTC Caller</title>
		<link rel="stylesheet" type="text/css" href="style.css">
		<script src="/socket.io/socket.io.js"></script>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
		<script>
			var socket = io();
			var pc,remoteView;
			var remoteStream =new MediaStream();
			var localICECandidateList=[];
			var configuration = {iceServers: 
						[{urls: "stun:stun.stunprotocol.org"},
						]};
			$( document ).ready(function() {
				remoteView=document.getElementById("remoteVideo");
				remoteView.srcObject = remoteStream;
			});
			async function createAnwser(offer) {
				writelog("0 Offer Have audio="+((offer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((offer.sdp.indexOf("video")>-1)?"yes":"no"));

				pc = new RTCPeerConnection(configuration);
				pc.onicecandidate = handleICECandidate;
				pc.ontrack=handleRemoteTrack;
				
				pc.setRemoteDescription(offer)
				.then(async function ()
					{
						writelog("0 Set Remote Description Success");
						await getLocalMedia();
						pc.createAnswer()
						.then((answer)=>{
							writelog("Create Answer success");
							pc.setLocalDescription(answer)
							.then(()=>{
								socket.emit('send_answer',answer);
								writelog("Answer Sent");	
							})
							.catch ((error)=>{
								writelog("Create Answer Failure:"+error);
							});	
						});
					})
				.catch ((error)=>{
					writelog("0 Set Remote Description Failure:"+error);
				});		
				

			}
			async function createOffer() {
				pc = new RTCPeerConnection(configuration);
				pc.onicecandidate = handleICECandidate;
				pc.ontrack=handleRemoteTrack;
				
				await getLocalMedia();
				pc.createOffer()
				.then((offer)=>{
						writelog("Create Offer success");
						writelog("1 Offer Have audio="+((offer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((offer.sdp.indexOf("video")>-1)?"yes":"no"));
						pc.setLocalDescription(offer)
						.then(()=>{
							writelog("Set Local Description Success");
							socket.emit('send_offer',offer);
							writelog("Offer Sent");
						});
					})
				.catch ((error)=>{
					writelog("Create Offer Failure:"+error);
				});
						
			}
			function datachannelopen() {
			  writelog('datachannelopen');
			  writelog('connected');
			}

			function datachannelmessage(message) {
			  writelog('datachannelmessage');
			  writelog(message);
			}			
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
			async function getLocalMedia() {
			  let stream = null;

			  try {
				stream = await navigator.mediaDevices.getUserMedia(getConstraints());
				document.getElementById("selfView").srcObject =stream;
				document.getElementById("selfView").play();
				stream.getTracks().forEach((track)=> {
						pc.addTrack(track);	
						//writelog(track.kind);
					});
				/* use the stream */
			  } catch(err) {
				/* handle the error */
			  }
			  finally {
				return stream
			  }
			}
			function handleICECandidate(event) {
				if (event.candidate) {
					localICECandidateList.push(event.candidate);
				} else {
					socket.emit('send_ice',localICECandidateList);
					writelog("0 ICE candidate list count="+localICECandidateList.length);
					writelog("ICE Sent");
				}
			}
			function handleRemoteTrack(event) {
				writelog("Track event"); 
				remoteStream.addTrack(event.track);		
			}
			function writelog(message){
				var logger=document.getElementById("logger");
				logger.innerHTML+=message+"<br>";
			}	
			socket.on("receive_answer",function (answer) {
				writelog("receive an answer");
				writelog("0 answer Have audio="+((answer.sdp.indexOf("audio")>-1)?"yes":"no")+",Have video="+((answer.sdp.indexOf("video")>-1)?"yes":"no"));
				pc.setRemoteDescription(answer)
				.then(()=>
					{
						writelog("1 Set Remote Description Success");
					})
				.catch((error)=>
					{
						writelog("1 Set Remote Description Failure:"+error);
					});
				writelog(pc.signalingState);	
			});
			
			socket.on("receive_iceCandidate",function (iceCandidateList) {
				writelog("receive ice candidate list");
				writelog("1 receive ICE candidate list count="+iceCandidateList.length);
				writelog("pc.currentRemoteDescription==null:"+(pc.currentRemoteDescription==null));
				iceCandidateList.forEach((iceCandidate)=>{
					pc.addIceCandidate(iceCandidate)
					//.then(()=>{writelog("1 ice candidate added")})
					.catch(e => {
						writelog("Failure during addIceCandidate(): " + e);
					});
				});
				writelog(pc.signalingState);
			});
			
			socket.on("receive_offer",function (offer) {
				writelog("receive an offer");
				createAnwser(offer);
			});
		</script>
	</head>
	<body>
		<div id="container">
			<div id="videoContainer">
				<div id="localVideo">
					<h1> Self View </h1>
					<div class="videoOut">
						<video id="selfView" autoplay controls muted></video>
					</div>					
				</div>
				<div id="remoteVideo">
					<h1> Remote View </h1>
					<div class="videoOut">
						<video id="remoteView" autoplay controls muted></video>
					</div>
				</div>
			</div>
			<div id="pannel">
				<input type="checkbox" id="shareAudio" onchange="toggleShareAudio(this)" checked>Share Audio 
				<input type="checkbox" id="shareVideo" onchange="toggleShareVideo(this)" checked>Share Video<br>
				<p>
					offering a connection to a peer
				</p>
				<p>
					<button id="buttoncreateoffer" onclick="createOffer()">call</button>
				</p>

				<div id="logger"></div>					
			</div>
		</div>
	</body>
</html>