class MediaPlayer {
	constructor(){
		var div,muted=true;	
		var maxMinCloneList=[],pInPCloneList=[];
		var btnDiv=document.createElement("div");
		var cardFooter=document.createElement("div");
		var container=document.createElement("div");
		
		var elapseTimeSpan=document.createElement("span");
		var id=new Date().getTime(),logger;
		var maxMinBtn,pInPBtn;
		var self=this,svgString;
		var videoTag=document.createElement("video");
		var upperDiv=document.createElement("div");
		
		container.className="card h-100 text-white";
		container.append(videoTag);
		container.append(cardFooter);
		container.onclick=(()=>{
			$(cardFooter).collapse("toggle");
		});		
		
		videoTag.className="card-body p-0";
		videoTag.autoplay=true; 
		videoTag.muted=true;
		videoTag.ontimeupdate=(()=>{
			elapseTimeSpan.textContent=videoTag.currentTime.toString().toHHMMSS();
		});		
		
		//Mute button
		div=document.createElement("div");
		div.innerHTML="&#x1f507;";
		div.className="btnlink";
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
		
		pInPBtn=document.createElement("div");
		pInPBtn.innerHTML=svgString;
		pInPBtn.className="btnlink";
		$(pInPBtn).click((event)=>{
			doPInP();
		});
		pInPBtn.title="P In P";
		btnDiv.append(pInPBtn);
		
		//Mirror button
		div=document.createElement("div");
		div.innerHTML="&#x21c4;";
		div.className="btnlink";
		$(div).click((event)=>{
			doMirror();	
		});
		div.title="Mirror Video";
		btnDiv.append(div);
		
		//Max/Min button
		maxMinBtn=document.createElement("div");
		maxMinBtn.innerHTML="&#x26f6;";
		maxMinBtn.className="btnlink maxMin";
		maxMinBtn.title="Max/Min video";
		$(maxMinBtn).click((event)=>{
			doMaxMin();
		});
		btnDiv.append(maxMinBtn);
		
		btnDiv.className="align-items-center d-flex flex-row justify-content-between p-0";
		upperDiv.className="align-items-center d-flex flex-row justify-content-between p-0";

		cardFooter.className="bg-secondary card-footer collapse controlPanel show p-1";
		cardFooter.append(upperDiv);
		cardFooter.append(btnDiv);		

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
			}
		});
		this.setCurrentTime=((currentTime)=>{
			videoTag.currentTime=currentTime;
		});
		this.setLogger=((wl)=>{
			logger=wl;
		});
		this.setMaxMinHandler=((handler)=>{
			$(maxMinBtn).unbind("click");
			$(maxMinBtn).click((event)=>{
				handler();
			});
		});
		this.setPInPHandler=((handler)=>{
			$(pInPBtn).unbind("click");
			$(pInPBtn).click((event)=>{
				handler();
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
		function doMaxMin(){
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				$(cardFooter).collapse("toggle");
				$(container).show();
			}
			if (maxMinCloneList.length>0){
				clearCloneList(maxMinCloneList);
				$(cardFooter).collapse("toggle");
				$(container).show();
			} else {	
				var clone=cloneObj();
				clone.maxMin();				
				$(container).hide();
				$(cardFooter).collapse("show");
				maxMinCloneList.push(clone);
			}
		}
		function doMirror(){
			$(videoTag).toggleClass("mirror");
		}
		function doPInP(){
			if (maxMinCloneList.length>0){
				clearCloneList(maxMinCloneList);
				$(cardFooter).collapse("show");
				$(container).show();
			}
			if (pInPCloneList.length>0){
				clearCloneList(pInPCloneList);
				$(cardFooter).collapse("show");
				$(container).show();
				
			} else {
				var clone=cloneObj();
				clone.pInP();				
				$(container).hide();
				pInPCloneList.push(clone);
			}
		}
		function getVideoTag(){
			return videoTag;
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
