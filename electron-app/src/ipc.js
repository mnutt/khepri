/* eslint-env node */

const path = require("path");
const debug = require("debug");
const { app, ipcMain, shell } = require("electron");

exports.tailPid = null;

exports.setupHandlers = monitorGroup => {
  ipcMain.handle("terminate", function terminate() {
    app.quit();
  });

  ipcMain.handle("getAll", function getAll() {
    return getProcessesStatus();
  });

  ipcMain.handle("getOne", function getOne(_, { name }) {
    return getProcessStatus(name);
  });

  ipcMain.handle("tailPid", function setTailPid(_, arg) {
    exports.tailPid = arg;
  });

  ipcMain.handle("start", async function start(_, { name }) {
    await monitorGroup.find(name).start();
    return getProcessStatus(name);
  });

  ipcMain.handle("stop", async function stop(_, { name }) {
    await monitorGroup.find(name).stop();
    return getProcessStatus(name);
  });

  ipcMain.handle("restart", async function restart(_, { name }) {
    await monitorGroup.find(name).restart();
    return getProcessStatus(name);
  });

  ipcMain.handle("startAll", async function startAll() {
    await monitorGroup.startAll();
    return getProcessesStatus();
  });

  ipcMain.handle("stopAll", async function stopAll() {
    await monitorGroup.stopAll();
    return getProcessesStatus();
  });

  ipcMain.handle("restartAll", async function restartAll() {
    await monitorGroup.restartAll();
    return getProcessesStatus();
  });

  ipcMain.handle("sendCommand", async function sendCommand(
    _,
    { name, command }
  ) {
    await monitorGroup.find(name).sendCommand(command);
    return getProcessStatus(name);
  });

  ipcMain.handle("create", function createProcess(_, [name, command]) {
    monitorGroup.createProcess(name, command);
    return getProcessStatus(name);
  });

  function getProcessStatus(procName) {
    return monitorGroup.find(procName).getStatus();
  }

  function getProcessesStatus() {
    debug("reload config, get proc status...");
    monitorGroup.loadConfig();

    return monitorGroup.processes.map(p => p.getStatus());
  }
};
