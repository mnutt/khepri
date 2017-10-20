/* eslint-env node */
'use strict';

const { app, BrowserWindow, protocol } = require('electron');
const { dirname, join, resolve }       = require('path');
const protocolServe                    = require('electron-protocol-serve');

const debug                            = require('debug');
const MonitorGroup                     = require('./lib/monitor-group');
const ms                               = require('ms');
const Server                           = require('electron-rpc/server');

// Registering a protocol & schema to serve our Ember application
protocol.registerStandardSchemes(['serve'], { secure: true });
protocolServe({
  cwd: join(__dirname || resolve(dirname('')), '..', 'ember'),
  app,
  protocol
});

try {
  process.env = require('user-env')();
} catch (e) {}

const server = new Server();

let mainWindow, canQuit, tailPid;

app.setName('khepri');
app.setPath('userData', app.getPath('userData').replace(/Application Support\/Electron/,
                                                        'Application Support/khepri'));

const dataDir = join(app.getPath('userData'), 'data');
console.log(dataDir);

const monitorGroup = new MonitorGroup(dataDir);

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});

app.on('will-quit', function(e) {
  if(canQuit) { return; }

  if(tailPid) {
    process.kill(tailPid, 'SIGTERM');
  }

  stopAll().then(() => {
    canQuit = true;

    process.nextTick(() => {
      app.quit();
    });
  });

  e.preventDefault();
});

app.on('ready', function onReady() {
  canQuit = false;

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hidden'
  });

  if(process.env.DEV_TOOLS) {
    mainWindow.webContents.openDevTools();
  }

  server.configure(mainWindow.webContents);

  const emberAppLocation = 'serve://dist';

  // By default, we'll open the Ember App by directly going to the
  // file system.
  mainWindow.loadURL(emberAppLocation);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadURL(emberAppLocation);
  });

  mainWindow.webContents.on('crashed', () => {
    console.log('Your Ember app (or other code) in the main window has crashed.');
    console.log('This is a serious issue that needs to be handled and/or debugged.');
  });

  mainWindow.on('unresponsive', () => {
    console.log('Your Ember app (or other code) has made the window unresponsive.');
  });

  mainWindow.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

});

// Handle an unhandled error in the main thread
//
// Note that 'uncaughtException' is a crude mechanism for exception handling intended to
// be used only as a last resort. The event should not be used as an equivalent to
// "On Error Resume Next". Unhandled exceptions inherently mean that an application is in
// an undefined state. Attempting to resume application code without properly recovering
// from the exception can cause additional unforeseen and unpredictable issues.
//
// Attempting to resume normally after an uncaught exception can be similar to pulling out
// of the power cord when upgrading a computer -- nine out of ten times nothing happens -
// but the 10th time, the system becomes corrupted.
//
// The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated
// resources (e.g. file descriptors, handles, etc) before shutting down the process. It is
// not safe to resume normal operation after 'uncaughtException'.
process.on('uncaughtException', (err) => {
  console.log('An exception in the main thread was not handled.');
  console.log('This is a serious issue that needs to be handled and/or debugged.');
  console.log(`Exception: ${err}`);
  console.log(err.stack);
});

server.on('terminate', function terminate (ev) {
  app.quit();
});

server.on('get-all', function getAll (req, next) {
  next(null, getProcessesStatus());
});

server.on('get-one', function getOne (req, next) {
  next(null, getProcessStatus(req.body.name));
});

server.on('tail-pid', function setTailPid (req, next) {
  tailPid = req.body;
});

server.on('task', function task (req, next) {
  if (req.body.task === 'startAll')   { startAll()             .then(updateAll); };
  if (req.body.task === 'stopAll')    { stopAll()              .then(updateAll); };
  if (req.body.task === 'restartAll') { restartAll()           .then(updateAll); };
  if (req.body.task === 'start')      { start(req.body.name)   .then(updateSingle); };
  if (req.body.task === 'stop')       { stop(req.body.name)    .then(updateSingle); };
  if (req.body.task === 'restart')    { restart(req.body.name) .then(updateSingle); };

  if (req.body.task === 'sendCommand') {
    sendCommand(req.body.name, req.body.command).then(updateSingle);
  };

  function updateAll (err) {
    if (err) { throw err; };
    next(null, getProcessesStatus());
  }

  function updateSingle (err) {
    if (err) { throw err; }
    next(null, getProcessStatus(req.body.name));
  }
});

server.on('create', function createProcess (req, next) {
  let [name, command] = req.body;
  monitorGroup.createProcess(name, command);
  next(null, getProcessStatus(req.body.name));
});

server.on('open-dir', function openDir (ev) {
  shell.showItemInFolder(join(monitorGroup.dir, 'config.json'));
});

server.on('open-logs-dir', function openLogsDir (req) {
  var proc = monitorGroup.find(req.body.name);
  shell.showItemInFolder(proc.logfile);
});

function getProcessStatus (procName) {
  var procs = getProcessesStatus();
  return procs.filter((proc) => {
    return proc.name === procName;
  })[0];
}

function getProcessesStatus () {
  debug('reload config, get proc status...');
  monitorGroup.loadConfig();
  var procs = monitorGroup.processes;

  return procs.map(function each (proc) {
    let {uptime, state} = proc;
    if (state === 'alive') {
      uptime = ms(parseInt(uptime) || 0, { long: true });
    }

    var item = {
      cmd: proc.command,
      name: proc.name,
      state: state,
      pid: proc.pid,
      log: proc.logfile,
      uptime: uptime ? uptime : undefined
    };

    return item;
  });
}

function restart (name, cb) {
  return monitorGroup.find(name).restart();
}

function start (name, cb) {
  return monitorGroup.find(name).start();
}

function stop (name, cb) {
  return monitorGroup.find(name).stop();
}

function sendCommand(name, command) {
  return monitorGroup.find(name).sendCommand(command);
}

function stopAll() {
  return monitorGroup.stopAll();
}

function startAll() {
  return monitorGroup.startAll();
}

function restartAll() {
  return monitorGroup.restartAll();
}
