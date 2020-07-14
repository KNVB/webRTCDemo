class MediaPlayer {
	constructor(){
		var div,muted=true;	
		var fullScreenCloneList=[],pInPCloneList=[];
		var btnDiv=document.createElement("div");
		var cardFooter=document.createElement("div");
		var container=document.createElement("div");
		var controlPanel=document.createElement("div");
		
		var elapseTimeSpan=document.createElement("span");
		var logger;
	
		var svgString;
		var videoTag=document.createElement("video");
		var upperDiv=document.createElement("div");
		
		container.className="card h-100 text-white";
		container.append(videoTag);
		container.append(cardFooter);
		
		videoTag.className="card-body p-0";
		videoTag.autoplay=true; 
		videoTag.muted=true;
		videoTag.ontimeupdate=(()=>{
			elapseTimeSpan.textContent=videoTag.currentTime.toString().toHHMMSS();
		});		
		
		//Mute button
		div=document.createElement("div");
		div.innerHTML="&#x1f507;";
		div.className="btnlink controlPanel";
		$(div).click((event)=>{
			if (muted) {
				videoTag.muted=false; 
				$(event.target).html("&#x1f50a;");				
			} else {
				videoTag.muted=true;
				$(event.target).html("&#x1f507;");				
			}
			muted=!muted;
		});
		div.title="Mute";
		upperDiv.append(div);

		div=document.createElement("div");
		div.className="elapseTime";
		div.append(elapseTimeSpan);	
		upperDiv.append(div);
		
		//P in P button
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\"";
		svgString+="width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" style=\"fill: white;\">";
		svgString+="<path d=\"M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z\"/>";
		svgString+="</svg>";
		
		div=document.createElement("div");
		div.innerHTML=svgString;
		div.className="btnlink";
		$(div).click((event)=>{
			pInP();
		});
		div.title="P In P";
		btnDiv.append(div);
		
		//Mirror button
		div=document.createElement("div");
		div.innerHTML="&#x21c4;";
		div.className="btnlink";
		$(div).click((event)=>{
			mirror();	
		});
		div.title="Mirror Video";
		btnDiv.append(div);
		
		//Max/Min button
		div=document.createElement("div");
		div.innerHTML="&#x26f6;";
		div.className="btnlink maxMin";
		div.title="Max/Min video";
		$(div).click((event)=>{
			maxMin();
		});
		btnDiv.append(div);
		
		btnDiv.className="align-items-center controlPanel d-flex flex-row justify-content-between";
		upperDiv.className="align-items-center controlPanel d-flex flex-row justify-content-between";
		
		controlPanel.className="d-flex flex-column pl-1 pr-1";
		controlPanel.append(upperDiv);
		controlPanel.append(btnDiv);		
				
		cardFooter.className="bg-secondary card-footer p-0";
		cardFooter.append(controlPanel);
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
		function clearCloneList(cloneList){
			var clone;
			while (cloneList.length>0){
				clone=cloneList.pop();
				$(clone).remove();
			}
		}
		function cloneVideo(clone){
			var cloneVideoTag=$(clone).find("video.card-body")[0];
			var cloneElapseTimeSpan=$(clone).find("div.elapseTime")[0];
			cloneVideoTag.currentTime=videoTag.currentTime;
			cloneVideoTag.srcObject=$(container).find("video.card-body")[0].srcObject;
			cloneVideoTag.ontimeupdate=(()=>{
				cloneElapseTimeSpan.textContent=cloneVideoTag.currentTime.toString().toHHMMSS();
			});
		}
		function getVideoTag(){
			return videoTag;
		}
		function maxMin(){
			var clone;
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				$(container).show();
			}
			if (fullScreenCloneList.length>0){
				clearCloneList(fullScreenCloneList);
				$(container).show();
			} else {	
				clone=$(container).clone(true);
				cloneVideo(clone);
				$(clone).addClass("full_screen");
				$(clone).find("div.maxMin").html("&#9634;");
				$("body").append(clone);
				$(container).hide();
				fullScreenCloneList.push(clone);
			}
		}
		function mirror(){
			$(videoTag).toggleClass("mirror");
		}
		function pInP(){
			var clone;
			if (fullScreenCloneList.length>0){
				clearCloneList(fullScreenCloneList);
				$(container).show();
			}
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				$(container).show();
			} else {
				var clone=$(container).clone(true);
				cloneVideo(clone);
				$("body").append(clone);
				$(clone).addClass("pinp");
				$(clone).removeClass("h-100");
				$(clone).removeClass("full_screen");
				$(clone).draggable();
				$(container).hide();
				pInPCloneList.push(clone);
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
