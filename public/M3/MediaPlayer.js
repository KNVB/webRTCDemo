class MediaPlayer {
	constructor(){
		var hideControlBar=true,logger,muted=true,svgString;	
		var maxMinCloneList=[],pInPCloneList=[];
		var container=document.createElement("div");
		var controlBar=document.createElement("div");
		var elapseTimeSpan=document.createElement("span");
		var id=new Date().getTime();
		var lowerControlBar=document.createElement("div");
		var maxMinBtn=document.createElement("div");
		var mirrorBtn=document.createElement("div");
		var muteBtn=document.createElement("div");
		var pInPBtn=document.createElement("div");
		var playerOverlay=document.createElement("div");
		var playerOverlayCenter=document.createElement("div");
		var upperControlBar=document.createElement("div");
		var videoTag=document.createElement("video");

		//Max/Min button		
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
		svgString+="<path d=\"M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3zM3 9l2.3-2.3 2.87 2.89 1.42-1.42L6.7 5.3 9 3H3zm6 12l-2.3-2.3 2.89-2.87-1.42-1.42L5.3 17.3 3 15v6zm12-6l-2.3 2.3-2.87-2.89-1.42 1.42 2.89 2.87L15 21h6z\"/>";
		svgString+="</svg>";
		maxMinBtn.innerHTML=svgString;
		maxMinBtn.className="btnlink maxMin";
		maxMinBtn.title="To Full Screen mode";
		$(maxMinBtn).click((event)=>{
			doMaxMin(event);
		});
		
		//Mirror button
		mirrorBtn.innerHTML="&#x21c4;";
		mirrorBtn.className="btnlink";
		mirrorBtn.title="Mirror Video";
		$(mirrorBtn).click((event)=>{
			toggleMirror(event);
		});
		
		//P in P button
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
		svgString+="<path d=\"M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z\"/>";
		svgString+="</svg>"
		
		pInPBtn.innerHTML=svgString;
		pInPBtn.className="btnlink";
		pInPBtn.title="P In P";		
		$(pInPBtn).click((event)=>{
			doPInP(event);
		});
		
		//Mute button
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
		svgString+="<path d=\"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z\"/>";
		svgString+="</svg>";

		muteBtn.innerHTML=svgString;
		muteBtn.className="btnlink";
		muteBtn.title="Mute";
		$(muteBtn).click((event)=>{
			toggleMute(event);
		});
		
		playerOverlay.onclick=((event)=>{
			if (!$(event.target).hasClass("btnlink")){
				$(controlBar).collapse("toggle");
			}
		});
		
		
		videoTag.className="card-body p-0 rounded w-100";
		videoTag.autoplay=true; 
		videoTag.muted=true;
		videoTag.ontimeupdate=(()=>{
			elapseTimeSpan.textContent=videoTag.currentTime.toString().toHHMMSS();
		});

		lowerControlBar.className="align-items-center d-flex flex-row justify-content-between p-0";
		upperControlBar.className="align-items-center d-flex flex-row justify-content-between p-0";
		controlBar.className="bg-secondary collapse controlBar p-1 show rounded text-white";
		playerOverlayCenter.className="center text-white";
		playerOverlay.className="playerOverlay p-1";
		container.className="card h-100";
		
		lowerControlBar.append(pInPBtn);
		lowerControlBar.append(mirrorBtn);
		lowerControlBar.append(maxMinBtn);
		
		upperControlBar.append(muteBtn);
		upperControlBar.append(elapseTimeSpan);
		
		controlBar.append(upperControlBar);
		controlBar.append(lowerControlBar);
		
		playerOverlay.append(playerOverlayCenter);
		playerOverlay.append(controlBar);
		
		container.append(videoTag);
		container.append(playerOverlay);
//=================================================================		
		this.addTrack=((track)=>{
			if (videoTag.srcObject==null){
				videoTag.srcObject=new MediaStream();
			}
			videoTag.srcObject.addTrack(track);
			logger("Remote "+track.kind+" track is added");		
		});
		this.collapseControlBar=(()=>{
			$(controlBar).collapse("hide");
		});
		this.getDOMObj=(()=>{
			return container;
		});

		this.maxMin=(()=>{
			$(container).addClass("full_screen");
			svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
			svgString+="<path d=\"M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z\"/>";
			svgString+="</svg>";
			maxMinBtn.innerHTML=svgString;
			maxMinBtn.title="Exit From Full Screen mode";
		});
		
		this.pInP=(()=>{
			$(container).removeClass("h-100");
			$(container).addClass("pinp");
			$(container).removeClass("h-100");
			$(container).removeClass("full_screen");
			$(container).draggable();
		});
		this.remove=(()=>{
			container.remove();
			container=null;
		});
		this.reset=(()=>{
			if (videoTag.srcObject!=null) {
				logger("closeVideoStream:no. of track="+videoTag.srcObject.getTracks().length);
				videoTag.srcObject.getTracks().forEach(async (track)=>{
					await track.stop();
				});
				videoTag.srcObject=null;
				doShowControlBar();
			}
		});
		this.setCurrentTime=((currentTime)=>{
			videoTag.currentTime=currentTime;
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
		this.setMaxMinHandler=((handler)=>{
			$(maxMinBtn).off("click");
			$(maxMinBtn).click((event)=>{
				handler(event);
			});
		});
		this.setMirrorHandler=((handler)=>{
			$(mirrorBtn).off("click");
			$(mirrorBtn).click((event)=>{
				toggleMirror(event);
				handler(event);
			});			
		});
		this.setMirrorState=((state)=>{
			if (state) {
				$(videoTag).addClass("mirror");
			} else {
				$(videoTag).removeClass("mirror");
			}
		});
		this.setMuteState=((isMute)=>{
			muted=isMute;
			setMuteState(isMute);
		});
		this.setMuteHandler=((handler)=>{
			$(muteBtn).off("click");
			$(muteBtn).click((event)=>{
				toggleMute(event);
				handler(event);
			});
		});
		this.setPInPHandler=((handler)=>{
			$(pInPBtn).off("click");
			$(pInPBtn).click((event)=>{
				handler(event);
			});
		});
		this.setSource=((src)=>{
			var source=document.createElement("source");
			source.src=src;
			videoTag.append(source);
		});
		this.setStream=((stream)=>{
			videoTag.srcObject=null;
			videoTag.srcObject=stream;
		});
		this.setTitle=((obj)=>{
			$(playerOverlayCenter).append(obj);
		});
		this.showControlBar=(()=>{
			$(controlBar).collapse("show");
		});
//==========================================================================================================				
		function clearCloneList(cloneList){
			var mp;
			while (cloneList.length>0){
				mp=cloneList.pop();
				mp.remove();
			}
		}
		function cloneObj(){
			var mp=new MediaPlayer();
			
			mp.setCurrentTime(videoTag.currentTime);
			mp.setLogger(logger);
			mp.setMaxMinHandler(doMaxMin);
			mp.setMirrorHandler(toggleMirror);
			mp.setMirrorState($(videoTag).hasClass("mirror"));
			mp.setMuteHandler(toggleMute);
			mp.setMuteState(muted);			
			mp.setPInPHandler(doPInP);
			mp.setStream(videoTag.srcObject);			
			mp.showControlBar();
			$("body").append(mp.getDOMObj());
			return mp;
		}
		function doMaxMin(event){
			event.stopPropagation();
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				$(container).show();
				doShowControlBar();
			}
			if (maxMinCloneList.length>0){
				clearCloneList(maxMinCloneList);
				doShowControlBar();
			} else {	
				var clone=cloneObj();
				clone.maxMin();
				$(controlBar).collapse("hide");				
				maxMinCloneList.push(clone);
			}
		}
		

		function doPInP(event){
			event.stopPropagation();	
			if (maxMinCloneList.length>0){
				clearCloneList(maxMinCloneList);
			}
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);

				$(container).show();
				doShowControlBar();
			} else {
				var clone=cloneObj();
				clone.pInP();
				$(container).hide();		
				pInPCloneList.push(clone);
			}
		}
		function doShowControlBar(){
			$(controlBar).collapse("show");
		}
		function setMuteState(isMute){
			if (isMute) {
				videoTag.muted=true;
				svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
				svgString+="<path d=\"M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z\"/>";
				svgString+="</svg>";
				$(muteBtn).html(svgString);				
			} else {
				videoTag.muted=false; 
				svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" style=\"fill: white;\" viewBox=\"0 0 24 24\">";
				svgString+="<path d=\"M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z\"/>";
				svgString+="</svg>";
				$(muteBtn).html(svgString);				
			}
			
		}
		function toggleMirror(event){
			event.stopPropagation();
			$(videoTag).toggleClass("mirror");
		}
		function toggleMute(event){
			event.stopPropagation();
			muted=!muted;
			setMuteState(muted);
		}
		String.prototype.toHHMMSS = function () {
			var result="";
			var sec_num = parseInt(this, 10); // don't forget the second param
			var hours   = Math.floor(sec_num / 3600);
			var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
			var seconds = sec_num - (hours * 3600) - (minutes * 60);

			if (hours>0){
				result=hours+":";
				if (hours < 10){
					result="0"+result;
				}
			}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}
			
			result+=minutes+':'+seconds;
			return result;
		}
	}
}	