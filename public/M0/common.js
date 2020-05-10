function datachannelopen() {
  console.log('datachannelopen');
  console.log('connected');
}
function datachannelmessage(message) {
  console.log('datachannelmessage');
  console.log(message);
}
function handleconnectionstatechange(event) {
  console.log('handleconnectionstatechange');
  console.log(event);
}
function handleiceconnectionstatechange(event) {
  console.log('ice connection state: ' + event.target.iceConnectionState);
}
function setLocalDescriptionSuccess() {
  console.log('setLocalDone');
}

function setLocalDescriptionFailed(reason) {
  console.log('setLocalFailed');
  console.log(reason);
}

function setRemoteDescriptionSuccess(){
	console.log("Set Remote Description Success");
}
function setRemoteDescriptionFailed(reason) {
	console.log("Set Remote Description Failure");
	console.log(reason);
}