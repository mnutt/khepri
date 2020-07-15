/* eslint-env node */

const path = require("path");
const debug = require("debug");
const { app, ipcMain, shell } = require("electron");

exports.tailPid = null;

exports.setupHandlers = monitorGroup => {
  ipcMain.handle("terminate", function terminate() {
    app.quit();
  });

  ipcMain.handle("get-all", function getAll() {
    return getProcessesStatus();
  });

  ipcMain.handle("get-one", function getOne(_, arg) {
    return getProcessStatus(arg.name);
  });

  ipcMain.handle("tail-pid", function setTailPid(_, arg) {
    exports.tailPid = arg;
  });

  ipcMain.handle("task", function task(_, arg) {
    switch (arg.task) {
      case "startAll":
        return startAll().then(updateAll);
      case "stopAll":
        return stopAll().then(updateAll);
      case "restartAll":
        return restartAll().then(updateAll);
      case "start":
        return start(arg.name).then(updateSingle);
      case "stop":
        return stop(arg.name).then(updateSingle);
      case "restart":
        return restart(arg.name).then(updateSingle);
      case "sendCommand":
        return sendCommand(arg.name, arg.command).then(updateSingle);
      default:
        console.log("Unknown command", arg);
    }

    function updateAll() {
      return getProcessesStatus();
    }

    function updateSingle() {
      return getProcessStatus(arg.name);
    }
  });

  ipcMain.handle("create", function createProcess(_, arg) {
    const [name, command] = arg;
    monitorGroup.createProcess(name, command);
    return getProcessStatus(name);
  });

  ipcMain.handle("open-dir", function openDir() {
    shell.showItemInFolder(path.join(monitorGroup.dir, "config.json"));
  });

  ipcMain.handle("open-logs-dir", function openLogsDir(_, arg) {
    const proc = monitorGroup.find(arg.name);
    shell.showItemInFolder(proc.logfile);
  });

  function getProcessStatus(procName) {
    return monitorGroup.find(procName).getStatus();
  }

  function getProcessesStatus() {
    debug("reload config, get proc status...");
    monitorGroup.loadConfig();

    return monitorGroup.processes.map(p => p.getStatus());
  }

  function restart(name) {
    return monitorGroup.find(name).restart();
  }

  function start(name) {
    return monitorGroup.find(name).start();
  }

  function stop(name) {
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
};
