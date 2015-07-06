'use strict';
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var globalShortcut = require('global-shortcut');
var Menu = require('menu');
var Tray = require('tray');

// Report crashes to our server.
require('crash-reporter').start();

require('electron-debug')();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var configPanel = null;
var mainWindow = null;
var appIcon = null;
var activationShortcut = 'cmd+1';

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
  var size = atomScreen.getPrimaryDisplay().workAreaSize;

  createMainWindow();

  //createConfigPanel();

  createTrayIcon();

  configShortcuts();


});

function configShortcuts() {
  var ret = globalShortcut.register('ctrl+x', toogleBusyMode);
  var ret = globalShortcut.register(activationShortcut, toogleBusyMode);
}

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
                                  x: 0,
                                  y: 0,
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

function createConfigPanel() {
  // Create the browser window.
  configPanel = new BrowserWindow({
                                  resizable: false,
                                  width: 500,
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
  appIcon = new Tray(__dirname + '/bell.png');

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
  console.log('Busy Mode Actived');
  if(mainWindow) {
    mainWindow.show();
  }
}

function deactiveBusyMode() {
  console.log('Busy Mode Desactived');
  if(mainWindow) {
    mainWindow.hide();
  }
}
