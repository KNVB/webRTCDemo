class MediaManager{
	constructor(){
		var logger;
		var sampleConstraint=getConstraints();
//==========================================================================================================
		this.createMediaPlayer=((logger)=>{
			var mediaPlayer =new MediaPlayer();
			mediaPlayer.setLogger(logger);
			return mediaPlayer;
		});
		this.getLocalStream=(async (videoSrc,shareAudio)=>{
			return await getLocalStream(videoSrc,shareAudio);
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
//==========================================================================================================		
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
		async function getLocalStream(videoSrc,shareAudio){
			var config,stream=null;
			
			config={};
			switch (videoSrc) {
				case "backCam":
				case "frontCam":
					config["video"]=sampleConstraint["video"];
					if (videoSrc=="backCam"){
						config["video"]["facingMode"]="environment";
					} else {
						config["video"]["facingMode"]="user";
					}
					if (shareAudio) {
						config["audio"]=sampleConstraint["audio"];
					}
					break;
				case "screen":
					config["video"]=true;
					config["audio"]=shareAudio;
					break;
			}
			logger("Video source="+videoSrc+",LocalMedia:config="+JSON.stringify(config));
			switch (videoSrc){
				case "backCam":
				case "frontCam":
					stream = await navigator.mediaDevices.getUserMedia(config);
					break;
				case "screen":
					stream = await navigator.mediaDevices.getDisplayMedia(config);
					break;
			}
			return stream;
		}
	}	
}