class Media{
	constructor() {
		var logger;
		var mediaRecorder = null;
		var recordedChunks=[];
		this.closeVideoStream=((v)=>{
				logger("closeVideoStream:id="+v.id);
				logger("closeVideoStream:v.srcObject="+v.srcObject);
				if (v.srcObject!=null) {
					logger("closeVideoStream:no. of track="+v.srcObject.getTracks().length);
					v.srcObject.getTracks().forEach(async (track)=>{
						await track.stop();
					});
					v.srcObject=null;
				}
		});
		
		
		this.getStream=(async (videoSrc,shareAudio)=>{
			var stream=null;
			switch (videoSrc) {
				case "webCam":
					stream=await getWebCamVideo(true,shareAudio);
					break;
				case "screen":	
					stream=await getShareDesktopVideo(shareAudio);
					if (shareAudio){
						if (stream.getAudioTracks().length<1) {
							var audioStream=await getWebCamVideo(false,true);
							if (audioStream) {
								audioStream.getAudioTracks().forEach((track)=>{
									stream.addTrack(track);
								});
							}	
						}
					}
					break;
				case "no":
					if (shareAudio){
						stream=await getWebCamVideo(false,true);	
					}
			}
			return stream;
		});
		this.handleRemoteTrack=((event,remoteVideo)=>{
			if (remoteVideo.srcObject==null){
				remoteView.srcObject=event.streams[0];
			} else {
				remoteVideo.srcObject.addTrack(event.track);
			}			
		});
		this.hasRecordedMedia=(()=>{
			return hasRecordedMedia();
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
		this.startRecord=((mediaObj)=>{
			var options = {mimeType: 'video/webm;codecs=h264'}; 
			try{
				mediaRecorder = new MediaRecorder(mediaObj.srcObject);
				recordedChunks=[];
				mediaRecorder.ondataavailable = ((event)=>{
					logger("ondataavailable event:"+event.data.size);
					if (event.data.size > 0) {
						recordedChunks.push(event.data);
					}
				});
				mediaRecorder.onstop=getRecordedMedia;
				mediaRecorder.start();
				logger("MediaRecorder is started");
			} catch (error){
				logger("Init MediaRecorder failure:"+error);
			}
		});
		this.stopRecord=(()=>{
			if (mediaRecorder != null){
				switch (mediaRecorder.state) {
					case "paused":
					case "recording":
						mediaRecorder.stop();
						logger("MediaRecorder is stopped");
						break;
				}
			}	
		});
//===================================================================================================		
		function getRecordedMedia(){
			logger("recordedChunks size="+recordedChunks[0].size);
			var blob = new Blob(recordedChunks, {
				type: "video/mp4"
			  });
			var url = URL.createObjectURL(blob);
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			a.href = url;
			a.download = "test.mp4";
			a.click();
			window.URL.revokeObjectURL(url);
		};
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
		async function getShareDesktopVideo(shareAudio){
			let stream = null;
			try{
				stream = await navigator.mediaDevices.getDisplayMedia({"audio":shareAudio,"video":true});
			}
			catch(error){
				logger("getShareDesktopVideo failure:"+error);
			}				
			finally {
				logger("getShareDesktopVideo complete");
				return stream
			}	
			
		}
		async function getWebCamVideo(shareVideo,shareAudio){
			let stream = null;
			var config=getConstraints();
			if (!shareAudio) {
				delete config["audio"];
			}
			if (!shareVideo){
				delete config["video"];
			}
			logger("LocalMedia:config="+JSON.stringify(config));
			try{
				stream = await navigator.mediaDevices.getUserMedia(config);
			} 
			catch(error){
				logger("getWebCamVideo failure:"+error);
			}				
			finally {
				logger("getWebCamVideo complete");
				return stream
			}
		}
		function hasRecordedMedia(){
			if (mediaRecorder == null) {
				return false;
			} else {
				logger("Media Recorder state="+mediaRecorder.state);
				switch (mediaRecorder.state){
					case "paused":
					case "recording":
						return true;
						break;
					default:	
						return (recordedChunks.length>0);
						break;
				}
			}	
		}
	}
}