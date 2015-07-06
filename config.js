var select = require('dom-select');

var ipc = require('ipc');

var autoLaunch = select('#auto-start');
var activeShorcutInput = select('#activeShortcut');
var doneButton = select('#done-button');

autoLaunch.onchange = function() {
  //console.log(autoLaunch.checked);
  ipc.send('auto-launch-changed', autoLaunch.checked);
}

doneButton.onclick = function() {
  ipc.send('close-config');
};

function setConfigurations() {

}

ipc.send('get-configurations');

ipc.on('load-configurations', function(arg) {
  console.log(arg);
  console.log(arg.autoStart);
  if(arg.hasOwnProperty('autoStart')) {
    console.log('hola')
    autoLaunch.checked = arg.autoStart;
  }
});
