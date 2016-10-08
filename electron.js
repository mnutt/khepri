/* jshint node: true */
'use strict';

const electron             = require('electron');
const path                 = require('path');
const {app, BrowserWindow} = electron;
const dirname              = __dirname || path.resolve(path.dirname());
const emberAppLocation     = `file://${dirname}/dist/index.html`;

const fs                   = require('fs');
const debug                = require('debug');
const mkdir                = require('mkdirp').sync;
const Mongroup             = require('mongroup');
const ms                   = require('ms');
const Server               = require('electron-rpc/server');

// Uncomment the lines below to enable Electron's crash reporter
// For more information, see http://electron.atom.io/docs/api/crash-reporter/

// electron.crashReporter.start({
//     productName: 'YourName',
//     companyName: 'YourCompany',
//     submitURL: 'https://your-domain.com/url-to-submit',
//     autoSubmit: true
// });

try {
  process.env = require('user-env')();
} catch (e) {}

const server = new Server();

let conf, mainWindow, canQuit;

app.on('window-all-closed', function onWindowAllClosed() {
  app.quit();
});

app.on('will-quit', function(e) {
  if(canQuit) { return; }

  stop([], 'SIGQUIT', () => {
    canQuit = true;
    app.quit();
  });

  e.preventDefault();
});


app.on('ready', function onReady() {
  canQuit = false;
  conf = loadConfig();

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hidden'
  });
  mainWindow.webContents.openDevTools();

  server.configure(mainWindow.webContents);

  delete mainWindow.module;

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
  });
});

function loadConfig () {
  const dir = path.join(app.getPath('userData'), 'data');
  const configFile = dir + '/config.json';
  let conf, data;

  try {
    data = fs.readFileSync(configFile);
  } catch (e) {
    if (e.code === 'ENOENT') {
      mkdir(dir);
      fs.writeFileSync(configFile, fs.readFileSync(__dirname + '/config.json'));
      return loadConfig();
    } else {
      throw e;
    }
  }

  try {
    conf = JSON.parse(data.toString());
  } catch (e) {
    var code = dialog.showMessageBox({
      message: 'Invalid configuration file\nCould not parse JSON',
      detail: e.stack,
      buttons: ['Reload Config', 'Exit app']
    });
    if (code === 0) {
      return loadConfig();
    } else {
      return app.quit();
    }
  }

  conf.exec = {cwd: dir};
  conf.logs = path.resolve(path.join(dir, conf.logs || 'logs'));
  conf.pids = path.resolve(path.join(dir, conf.pids || 'pids'));

  mkdir(conf.logs);
  mkdir(conf.pids);

  conf.mon = path.join(__dirname, 'mon.js');
  return conf;
}

server.on('terminate', function terminate (ev) {
  app.quit();
});

server.on('get-all', function getAll (req, next) {
  next(null, getProcessesStatus());
});

server.on('get-one', function getOne (req, next) {
  next(null, getProcessStatus(req.body.name));
});

server.on('task', function task (req, next) {
  if (req.body.task === 'startAll') { start([], updateAll); };
  if (req.body.task === 'stopAll') { stop([], req.body.signal, updateAll); };
  if (req.body.task === 'restartAll') { restart([], updateAll); };
  if (req.body.task === 'start') { start([req.body.name], updateSingle); };
  if (req.body.task === 'stop') { stop([req.body.name], req.body.signal, updateSingle); };
  if (req.body.task === 'restart') { restart([req.body.name], updateSingle); };

  function updateAll (err) {
    if (err) { throw err; };
    next(null, getProcessesStatus());
  }

  function updateSingle (err) {
    if (err) { throw err; }
    next(null, getProcessStatus(req.body.name));
  }
});

server.on('open-dir', function openDir (ev) {
  shell.showItemInFolder(path.join(conf.exec.cwd, 'config.json'));
});

server.on('open-logs-dir', function openLogsDir (req) {
  shell.showItemInFolder(path.join(conf.logs, req.body.name + '.log'));
});

function getProcessStatus (procName) {
  var procs = getProcessesStatus();
  return procs.filter((proc) => {
    return proc.name === procName;
  })[0];
}

function getProcessesStatus () {
  debug('reload config, get proc status...');
  conf = loadConfig();
  var group = new Mongroup(conf);
  var procs = group.procs;

  return procs.map(function each (proc) {
    var uptime, state = proc.state();
    if (state === 'alive') {
      uptime = ms(Date.now() - proc.mtime(), { long: true });
    }

    var item = {
      cmd: proc.cmd,
      name: proc.name,
      state: state,
      pid: proc.pid,
      log: path.join(conf.logs, `${proc.name}.log`),
      uptime: uptime ? uptime : undefined
    };

    return item;
  });
}

function restart (procs, cb) {
  stop(procs, 'SIGQUIT', function onstop (err1) {
    start(procs, function onstart (err2) {
      if (cb) {
        cb(err1 || err2);
      }
    });
  });
}

function start (procs, cb) {
  var group = new Mongroup(conf);
  group.start(procs, function onstart (err) {
    if (err) {
      return cb(err);
    }
    return cb();
  });
}

function stop (procs, signal, cb) {
  if (!signal) {
    signal = 'SIGQUIT';
  }

  var group = new Mongroup(conf);
  group.stop(procs, signal, function onstop (err) {
    if (!err || err.code === 'ENOENT') {
      return cb();
    }
    return cb(err);
  });
}
