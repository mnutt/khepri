const fs = require('fs');
const EventEmitter = require('events');
const mkdir = require('mkdirp').sync;
const path = require('path');
const Monitor = require('./monitor');
const RSVP = require('rsvp');

class MonitorGroup extends EventEmitter {
  constructor(dataDir) {
    super(...arguments);
    this.dataDir = dataDir;
    this.configFile = path.join(dataDir, 'config.json');
    this.processes = [];
    this.loadConfig();
  }

  loadConfig() {
    let conf, data;

    try {
      data = fs.readFileSync(this.configFile);
    } catch (e) {
      if (e.code === 'ENOENT' && !this.failedWritingConfigDirectory) {
        mkdir(this.dataDir);
        fs.writeFileSync(this.configFile, fs.readFileSync(__dirname + '/config.json'));
        this.failedWritingConfigDirectory = true;
        return this.loadConfig();
      } else {
        throw e;
      }
    }

    try {
      conf = JSON.parse(data.toString());
    } catch (e) {
      this.emit('error', e);
    }

    conf.logs = path.resolve(path.join(this.dataDir, conf.logs || 'logs'));
    conf.pids = path.resolve(path.join(this.dataDir, conf.pids || 'pids'));

    mkdir(conf.logs);
    mkdir(conf.pids);

    let newProcesses = [];
    let oldProcesses = this.processes;

    for(var processName in conf.processes) {
      let command = conf.processes[processName];
      let existingProcess = this.find(processName);

      if(existingProcess) {
        newProcesses.push(existingProcess);
        delete oldProcesses[this.processes.indexOf(existingProcess)];

        existingProcess.command = command;
      } else {
        newProcesses.push(new Monitor({
          name: processName,
          command: command,
          conf: conf
        }));
      }
    }

    // these are old processes no longer in the config, terminate them before we
    // dereference them
    oldProcesses.forEach((process) => process && process.stop());

    this.processes = newProcesses;

    return conf;
  }

  find(name) {
    return this.processes.find((p) => p && p.name == name);
  }

  stopAll() {
    return RSVP.all(this.processes.map((proc) => {
      return proc.stop();
    }));
  }

  startAll() {
    return RSVP.all(this.processes.map((proc) => {
      return proc.start();
    }));
  }

  restartAll() {
    return RSVP.all(this.processes.map((proc) => {
      return proc.restart();
    }));
  }
}

module.exports = MonitorGroup;
