var select = require('dom-select');

var ipc = require('ipc');

/*
console.log(ipc.sendSync('synchronous-message', 'ping')); // prints "pong"

ipc.on('asynchronous-reply', function(arg) {
  console.log(arg); // prints "pong"
});
ipc.send('asynchronous-message', 'ping');
*/

var activeShorcutInput = select('#activeShortcut');
var doneButton = select('#done-button');

doneButton.onclick = function() {
  ipc.send('close-config');
};

function setConfigurations() {

}
