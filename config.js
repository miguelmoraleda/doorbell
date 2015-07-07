var select = require('dom-select');

var ipc = require('ipc');

var autoLaunch = select('#auto-start');
var activeShorcutInput = select('#activeShortcut');
var doneButton = select('#done-button');
var radioButtons = select.all('input[type=radio]');

for (var k = 0; k < radioButtons.length; k++) {
  if(!radioButtons[k]) continue;

  radioButtons[k].onchange = function() {
    for (var i = 0; i < radioButtons.length; i++) {
      if(radioButtons[i].checked) {
          ipc.send('alert-view-changed', radioButtons[i].value);
      }
    }
  };
}

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
  if(arg.hasOwnProperty('autoStart')) {
    autoLaunch.checked = arg.autoStart;
  }
  if(arg.hasOwnProperty('alertViewMode')) {
    switch (arg.alertViewMode) {
      case 'rectangle':
        radioButtons[0].checked = true;
        break;
      case 'circle':
        radioButtons[1].checked = true;
        break;
      case 'none':
        radioButtons[2].checked = true;
        break;
      default:

    }
    autoLaunch.checked = arg.autoStart;
  }
});
