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
		maxMinBtn.innerHTML="&#x26f6;";
		maxMinBtn.className="btnlink maxMin";
		maxMinBtn.title="Max/Min video";
		$(maxMinBtn).click((event)=>{
			doMaxMin(event);
		});
		
		//Mirror button
		mirrorBtn.innerHTML="&#x21c4;";
		mirrorBtn.className="btnlink";
		mirrorBtn.title="Mirror Video";
		$(mirrorBtn).click((event)=>{
			doMirror(event);
		});
		
		//P in P button
		svgString ="<svg xmlns=\"http://www.w3.org/2000/svg\"";
		svgString+="width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" style=\"fill: white;\">";
		svgString+="<path d=\"M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z\"/>";
		svgString+="</svg>";
		pInPBtn.innerHTML=svgString;
		pInPBtn.className="btnlink";
		pInPBtn.title="P In P";		
		$(pInPBtn).click((event)=>{
			doPInP(event);
		});
		
		//Mute button
		muteBtn.innerHTML="&#x1f507;";
		muteBtn.className="btnlink";
		muteBtn.title="Mute";
		$(muteBtn).click((event)=>{
			doMute(event);
		});
		
		playerOverlay.onclick=((event)=>{
			if (!$(event.target).hasClass("btnlink")){
				$(controlBar).collapse("toggle");
			}
		});
		
		
		videoTag.className="card-body p-0";
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
		this.getDOMObj=(()=>{
			return container;
		});
		this.maxMin=(()=>{
			$(container).addClass("full_screen");
			maxMinBtn.innerHTML="&#9634;";
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
		this.setPInPHandler=((handler)=>{
			$(pInPBtn).unbind("click");
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
			mp.setStream(videoTag.srcObject);
			mp.setMaxMinHandler(doMaxMin);
			mp.setPInPHandler(doPInP);
			mp.setLogger(logger);
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
		function doMirror(event){
			event.stopPropagation();
			$(videoTag).toggleClass("mirror");
		}
		function doMute(event){
			event.stopPropagation();
			if (muted) {
				videoTag.muted=false; 
				$(muteBtn).html("&#x1f50a;");				
			} else {
				videoTag.muted=true;
				$(muteBtn).html("&#x1f507;");				
			}
			muted=!muted;
		}
		function doPInP(event){
			event.stopPropagation();	
			if (maxMinCloneList.length>0){
				clearCloneList(maxMinCloneList);
			}
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				hideControlBar=false;

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