import { A } from "@ember/array";

import Service from "@ember/service";
import { run } from "@ember/runloop";
import RSVP from "rsvp";
import Process from "khepri/models/process";

const { ipcRenderer } = requireNode("electron");

export default Service.extend({
  list: null,
  itemMap: null,

  init() {
    this._super(...arguments);

    this.set("itemMap", {});
    this.set("list", A());
    this.updateLoop();
  },

  find(name) {
    let item = this.itemMap[name];
    if (item) {
      return RSVP.cast(item);
    } else {
      return this.update().then(() => {
        return this.itemMap[name];
      });
    }
  },

  updateLoop() {
    this.update()
      .then(() => {
        run.later(() => {
          this.updateLoop();
        }, 1000);
      })
      .catch(err => {
        const { log } = console;
        log("Service update error", err);
        run.later(() => {
          this.updateLoop();
        }, 5000);
      });
  },

  stop(name, signal) {
    return this.execTask({ task: "stop", name, signal }).then(data => {
      return this.createOrUpdate(data);
    });
  },

  stopAll() {
    this.list.forEach(process => {
      this.stop(process.name, "SIGTERM");
    });
  },

  start(name) {
    return this.execTask({ task: "start", name }).then(data => {
      return this.createOrUpdate(data);
    });
  },

  startAll() {
    this.list.forEach(process => {
      this.start(process.name);
    });
  },

  restart(name) {
    return this.execTask({ task: "restart", name }).then(data => {
      return this.createOrUpdate(data);
    });
  },

  restartAll() {
    this.list.forEach(process => {
      this.restart(process.name);
    });
  },

  sendCommand(name, command) {
    return this.execTask({ task: "sendCommand", name, command }).then(data => {
      return this.createOrUpdate(data);
    });
  },

  request(command, value) {
    return ipcRenderer.invoke(command, value);
  },

  execTask(task) {
    return this.request("task", task);
  },

  async update() {
    const data = await this.request("get-all");

    let allRecordsExisted = true;
    const newRecords = data.map(record => {
      if (!this.itemMap[record.name]) {
        allRecordsExisted = false;
      }
      return this.createOrUpdate(record);
    });

    if (this.list.length !== data.length || !allRecordsExisted) {
      this.set("list", newRecords);
    }

    return newRecords;
  },

  createOrUpdate(attrs) {
    let newProcess;
    let key = attrs.name;
    let prior = this.itemMap[key];
    if (prior) {
      prior.setProperties(attrs);
      newProcess = prior;
    } else {
      newProcess = Process.create(attrs);
      this.set(`itemMap.${key}`, newProcess);
    }
    return newProcess;
  }
});
