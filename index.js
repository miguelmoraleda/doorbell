'use strict';
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var Menu = require('menu');
var Tray = require('tray');
var ipc = require('ipc');
var settings = require('./settings');

var AutoLaunch = require('auto-launch');

var autoStart = false;
var alertViewMode = 'rectangle';

// Report crashes to our server.
require('crash-reporter').start();

//require('electron-debug')();

var autoLauncher = new AutoLaunch({
    name: 'DoorBell',
    path: '/Applications/DoorBell.app',
    isHidden: true // hidden on launch - only works on a mac atm.
});

autoLauncher.isEnabled(function(enabled) {
  if(enabled) {
    autoStart = true;
    return;
  } else {
    autoStart = false;
  }
});

ipc.on('alert-view-changed', function(event, arg) {
  alertViewMode = arg;
  settings.set('alertViewMode', alertViewMode, function(err) {
    if (err)
      throw err
    else
      console.log('alertViewMode state saved', alertViewMode);
  });
  if(isBusy) {
      deactiveBusyMode();
      activeBusyMode();
  }
});

ipc.on('auto-launch-changed', function(event, arg) {
  if(!autoLauncher) return;
  autoStart = arg;
  settings.set('autoStart', autoStart, function(err) {
    if (err)
      throw err
    else
      console.log('autoStart state saved', autoStart);
  });
  if(autoStart) {
    autoLauncher.isEnabled(function(enabled) {
      if(enabled) return;
      autoLauncher.enable();
    });
  } else {
    autoLauncher.isEnabled(function(enabled) {
      if(enabled) autoLauncher.disable();
    });
  }
});

ipc.on('close-config', function(event, arg) {
  if(configPanel) {
    configPanel.close();
  }
});

ipc.on('get-configurations', function(event, arg) {
  //console.log(arg);  // prints "ping"
  //event.sender.send('load-configurations', { autoStart: autoStart });
  event.sender.send('load-configurations', { autoStart: autoStart, alertViewMode: alertViewMode });
});




// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var configPanel = null;
var mainWindow = null;
var appIcon = null;
var workArea = null;
var bounds = null;
var activationShortcut = 'cmd+shift+1';
var rectangleAlert = [];

var isBusy = false;
var showingConfigs = false;


// Quit when all windows are closed.
/*app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});
*/
// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  var atomScreen = require('screen');
  console.log(atomScreen.getPrimaryDisplay());
  workArea = atomScreen.getPrimaryDisplay().workArea;
  bounds = atomScreen.getPrimaryDisplay().bounds;

  checkSettings();

  createTrayIcon();

  configShortcuts();
});

function checkSettings() {
  settings.get('autoStart', function(err, value) {
    if (err)
      throw err

      console.log('autoStart', value);
    if (typeof value !== 'undefined') {
      autoStart = value;
      console.log('autoStart', value);
    }
  });
  settings.get('alertViewMode', function(err, value) {
    if (err)
      throw err

      console.log('alertViewMode', value);
    if (typeof value !== 'undefined') {
      alertViewMode = value;
      console.log('alertViewMode', value);
    }
  });
}

function configShortcuts() {
  var ret = globalShortcut.register(activationShortcut, toogleBusyMode);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
                                  x: 0,
                                  y: 0,
                                  'skip-taskbar': true,
                                  resizable: false,
                                  width: 50,
                                  height: 50,
                                  show: true,
                                  'always-on-top': true,
                                  frame: false,
                                  transparent: true});

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
}

function createRectangleAlert() {

  var areas = [
    { x: 0, y: workArea.y, w: 5, h: workArea.height },
    { x: 0, y: workArea.y, w: workArea.width, h: 5 },
    { x: 0, y: bounds.height+workArea.y - 5, w: workArea.width, h: 5 },
    { x: workArea.width-5, y: workArea.y, w: 5, h: workArea.height },
  ]
  rectangleAlert = [];
  for (var i = 0; i < 4; i++) {
    rectangleAlert[i] = new BrowserWindow({
                                    x: areas[i].x,
                                    'skip-taskbar': true,
                                    'enable-larger-than-screen': true,
                                    y: areas[i].y,
                                    resizable: false,
                                    width: areas[i].w,
                                    height: areas[i].h,
                                    show: true,
                                    'always-on-top': true,
                                    frame: false,
                                    transparent: true});

    // and load the index.html of the app.
    rectangleAlert[i].loadUrl('file://' + __dirname + '/rectangle.html');
  }
}

function destroyRectangleAlert() {
  for (var i = 0; i < 4; i++) {
    if(rectangleAlert[i] !== undefined) {
      rectangleAlert[i].close();
      rectangleAlert[i] = null;
      delete rectangleAlert[i];
    }
  }
}

function createConfigPanel() {
  configPanel = new BrowserWindow({
                                  resizable: false,
                                  width: 500,
                                  'skip-taskbar': true,
                                  height: 350,
                                  show: true,
                                  'always-on-top': true,
                                  frame: true,
                                  transparent: false});

  configPanel.loadUrl('file://' + __dirname + '/configPanel.html');
  configPanel.on('closed', function() {
    configPanel = null;
  });
}

function createTrayIcon() {
  appIcon = new Tray(__dirname + '/bell-icon.png');

  var contextMenu = Menu.buildFromTemplate([
    { label: 'Active', click: function() {activeBusyMode();} },
    { label: 'Deactive', click: function() {deactiveBusyMode();} },
    { label: 'Preferences', click: function() { createConfigPanel(); } },
    { label: 'About' },
    { type: 'separator' },
    { label: 'Quit', click: function() { app.quit(); } },
  ]);

  appIcon.setToolTip('DoorBell by Michael Dobell.');
  appIcon.setContextMenu(contextMenu);
}

function toogleBusyMode() {
  if(isBusy) {
    deactiveBusyMode();
  } else {
    activeBusyMode();
  }
}

function activeBusyMode() {
  isBusy = true;
  console.log('Busy Mode Actived', alertViewMode);
  switch (alertViewMode) {
    case 'rectangle':
      createRectangleAlert();
      break;
    case 'circle':
      createMainWindow();
      break;
    case 'none':

      break;
    default:

  }
}

function deactiveBusyMode() {
  isBusy = false;
  console.log('Busy Mode Desactived',rectangleAlert[0]);
  if(mainWindow) {
    mainWindow.hide();
  }
  if(rectangleAlert[0]) {
      destroyRectangleAlert();
  }
}
