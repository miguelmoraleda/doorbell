'use strict';
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var Menu = require('menu');
var Tray = require('tray');
var ipc = require('ipc');

var AutoLaunch = require('auto-launch');

var autoStart = false;

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

ipc.on('auto-launch-changed', function(event, arg) {
  if(!autoLauncher) return;
  autoStart = arg;
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
  console.log(arg);  // prints "ping"
  //event.sender.send('load-configurations', { autoStart: autoStart });
  event.sender.send('load-configurations', { autoStart: autoStart });
});


// Report crashes to our server.
require('crash-reporter').start();

//require('electron-debug')();

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
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  var atomScreen = require('screen');
  console.log(atomScreen.getPrimaryDisplay());
  workArea = atomScreen.getPrimaryDisplay().workArea;
  bounds = atomScreen.getPrimaryDisplay().bounds;
  createMainWindow();

  createTrayIcon();

  configShortcuts();

});

function configShortcuts() {
  var ret = globalShortcut.register(activationShortcut, toogleBusyMode);
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
                                  x: 0,
                                  y: 0,
                                  'skip-taskbar': true,
                                  resizable: false,
                                  width: 50,
                                  height: 50,
                                  show: false,
                                  'always-on-top': true,
                                  frame: false,
                                  transparent: true,
                                  fullscreen: false});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the devtools.
  //mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    //mainWindow = null;
  });
}

function createRectangleAlert() {

  var areas = [
    { x: 0, y: workArea.y, w: 5, h: workArea.height },
    { x: 0, y: workArea.y, w: workArea.width, h: 5 },
    { x: 0, y: bounds.height+workArea.y - 5, w: workArea.width, h: 5 },
    { x: workArea.width-5, y: workArea.y, w: 5, h: workArea.height },
  ]

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

    rectangleAlert[i].on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      rectangleAlert[i] = null;
    });
  }
}

function destroyRectangleAlert() {
  for (var i = 0; i < 4; i++) {
    if(rectangleAlert[i]) {
      rectangleAlert[i].close();
    }
  }
}

function createConfigPanel() {
  // Create the browser window.
  configPanel = new BrowserWindow({
                                  resizable: false,
                                  width: 500,
                                  'skip-taskbar': true,
                                  height: 350,
                                  show: true,
                                  'always-on-top': true,
                                  frame: true,
                                  transparent: false});

  // and load the index.html of the app.
  configPanel.loadUrl('file://' + __dirname + '/configPanel.html');

  // Open the devtools.
  //mainWindow.openDevTools();

  // Emitted when the window is closed.
  configPanel.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
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
    isBusy = false;
    deactiveBusyMode();
  } else {
    isBusy = true;
    activeBusyMode();
  }
}

function activeBusyMode() {
  //console.log('Busy Mode Actived');
  if(mainWindow) {
    //mainWindow.show();

  }
  createRectangleAlert();
}

function deactiveBusyMode() {
  //console.log('Busy Mode Desactived');
  if(mainWindow) {
    //mainWindow.hide();

  }
  destroyRectangleAlert()
}
