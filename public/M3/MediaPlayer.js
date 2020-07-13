class MediaPlayer {
	constructor(){
		let isMaximized = true,muted=true;	
		
		var container=document.createElement("div");
		var controlPanel=document.createElement("div");
		var div=document.createElement("div");
		var elapseTimeSpan=document.createElement("span");
		var logger;
		var maxMinWinLink= document.createElement("a");
		var muteLink = document.createElement("a");
		var pInPLink= document.createElement("a");
		var svgString;
		var videoTag=document.createElement("video");
		
		videoTag.className="card-body p-0";
		videoTag.autoplay=true; 
		videoTag.muted=true;
		videoTag.ontimeupdate=(()=>{
			elapseTimeSpan.textContent=videoTag.currentTime.toString().toHHMMSS();
		});		
		
		controlPanel.className="align-items-center bg-secondary card-footer d-flex flex-row "; 
		controlPanel.className+="h4 justify-content-between mb-0 p-1";
		
		muteLink.href="javascript:void(0)";
		muteLink.className="btnlink";
		muteLink.innerHTML="&#x1f507;"
		$(muteLink).click(()=>{
			if (muted) {
				videoTag.muted=false; 
				muteLink.innerHTML="&#x1f50a;";				
			} else {
				videoTag.muted=true;
				muteLink.innerHTML="&#x1f507;";				
			}
			muted=!muted;
		});
		
		div.append(muteLink);
		div.append(elapseTimeSpan);
		controlPanel.append(div);
		
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\"";
		svgString+="width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" style=\"fill: white;\">";
		svgString+="<path d=\"M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z\"/>";
		svgString+="</svg>";
		
		pInPLink.href="javascript:void(0)";
		pInPLink.className="btnlink";
		pInPLink.innerHTML=svgString;
		pInPLink.onclick=pInP;
		
		div=document.createElement("div");
		div.append(pInPLink);
		controlPanel.append(div);
		
		div=document.createElement("div");
		maxMinWinLink.href="javascript:void(0)";
		maxMinWinLink.className="btnlink";
		maxMinWinLink.innerHTML="&#x26f6;";
		maxMinWinLink.onclick=maxMinWindow;
		
		div.append(maxMinWinLink);
		controlPanel.append(div);
		
		container.className="card h-100 text-white";
		container.append(videoTag);
		container.append(controlPanel);
		
//==========================================================================================================						
		this.addTrack=((track)=>{
			if (videoTag.srcObject==null){
				videoTag.srcObject=new MediaStream();
			}
			videoTag.srcObject.addTrack(track);
			logger("Remote "+track.kind+" track is added");		
		});
		this.getDOMObj=(()=>{
			return container;
		});
		this.getVideoTag=(()=>{
			return getVideoTag();
		});
		this.reset=(()=>{
			if (videoTag.srcObject!=null) {
				logger("closeVideoStream:no. of track="+videoTag.srcObject.getTracks().length);
				videoTag.srcObject.getTracks().forEach(async (track)=>{
					await track.stop();
				});
				videoTag.srcObject=null;
			}
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
		this.setSource=((src)=>{
			setSource(src);
		});
		this.setStream=((stream)=>{
			setStream(stream);
		});
//==========================================================================================================				
		function getVideoTag(){
			return videoTag;
		}
		function maxMinWindow(){
			$(container).removeClass("pinp");
			if (!$(container).hasClass("h-100")){
				$(container).addClass("h-100");
			}
			if (isMaximized) {
				$(container).addClass("full_screen");
				maxMinWinLink.innerHTML="&#9634;";
			} else {
				$(container).removeClass("full_screen");
				maxMinWinLink.innerHTML="&#x26f6;";
			}
			isMaximized = !isMaximized;
		}
		function pInP(){
			$(container).toggleClass("pinp");
			$(container).toggleClass("h-100");
			if ($(container).hasClass("full_screen")){
				$(container).removeClass("full_screen");
			}
		}
		function setSource(src){
			var source=document.createElement("source");
			source.src=src;
			videoTag.append(source);
		}
		function setStream(stream){
			videoTag.srcObject=null;
			videoTag.srcObject=stream;
		}
		String.prototype.toHHMMSS = function () {
			var sec_num = parseInt(this, 10); // don't forget the second param
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
			return hours+':'+minutes+':'+seconds;
		}
	}
}
