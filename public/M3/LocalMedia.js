class LocalMedia{
	constructor() {
		
		this.getShareDesktopVideo=(async ()=>{
			return await getShareDesktopVideo();
		});
		
		this.getWebCamVideo=(async ()=>{
			return await getWebCamVideo(); 
		});
		this.getStream=(async(videoSrc,shareAudio)=>{
			return await getStream(videoSrc,shareAudio);
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
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
		async function getStream(videoSrc,shareAudio){
			var mediaStream=null,webCamStream=null,screenStream=null;
			switch (videoSrc) {
				case "no":
							if (shareAudio=="yes") {
								webCamStream=await getWebCamVideo();
								mediaStream=new MediaStream();
								webCamStream.getAudioTracks().forEach((track)=>{
									mediaStream.addTrack(track);
								});
							}
							break;
				case "screen":
								screenStream=await getShareDesktopVideo();
								mediaStream=new MediaStream();
								if (shareAudio=="yes") {
									if (screenStream.getAudioTracks().length<1) {
										webCamStream=await getWebCamVideo();
										mediaStream=new MediaStream();
										webCamStream.getAudioTracks().forEach((track)=>{
											mediaStream.addTrack(track);
										});
										screenStream.getVideoTracks().forEach((track)=>{
											mediaStream.addTrack(track);
										});
									} else {
										mediaStream=screenStream.clone();	
									}
								} else {
									screenStream.getVideoTracks().forEach((track)=>{
										mediaStream.addTrack(track);
									});	
								}
								break;
				case "webCam":
								webCamStream=await getWebCamVideo();
								if (shareAudio=="yes") {
									mediaStream=webCamStream.clone();
								} else {
									mediaStream=new MediaStream();
									webCamStream.getVideoTracks().forEach((track)=>{
										mediaStream.addTrack(track);
									});	
								}
								break;
			}
			return mediaStream;
		}	
		async function getShareDesktopVideo(){
			let stream = null;
			stream = await navigator.mediaDevices.getDisplayMedia({"audio":true,"video":true});
			return stream;
			
		}
		async function getWebCamVideo() {
			let stream = null;
			stream = await navigator.mediaDevices.getUserMedia(getConstraints());
			return stream;
		}		
	}
}