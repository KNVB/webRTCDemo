class LocalMedia{
	constructor() {
		var logger;
		this.getStream=(async (videoSrc,shareAudio)=>{
			var stream=null;
			switch (videoSrc) {
				case "webCam":
								stream=await getWebCamVideo(true,shareAudio);
								break;
				case "screen":	stream=await getShareDesktopVideo(shareAudio);
								if (shareAudio){
									if (stream.getAudioTracks().length<1) {
										var audioStream=await getWebCamVideo(false,true);
										audioStream.getAudioTracks().forEach((track)=>{
											stream.addTrack(track);
										});
									}
								}
								break;
				case "no":if (shareAudio){
							stream=await getWebCamVideo(false,true);	
						  }
			}
			return stream;
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
		async function getShareDesktopVideo(shareAudio){
			let stream = null;
			stream = await navigator.mediaDevices.getDisplayMedia({"audio":shareAudio,"video":true});
			return stream;
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
			stream = await navigator.mediaDevices.getUserMedia(config);
			return stream;
		}
	}
}