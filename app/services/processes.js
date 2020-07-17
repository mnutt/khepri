import Service from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { run } from "@ember/runloop";
import Process from "khepri/models/process";

const { ipcRenderer } = requireNode("electron");

export default class ProcessService extends Service {
  @tracked list = [];
  itemMap = {};

  constructor() {
    super(...arguments);
    this.updateLoop();
  }

  async find(name) {
    let item = this.itemMap[name];
    if (item) {
      return item;
    } else {
      await this.updateAll();
      return this.itemMap[name];
    }
  }

  async updateLoop() {
    let updateTime = 1000;

    try {
      await this.updateAll();
    } catch (err) {
      const { log } = console;
      log("Service update error", err);
      updateTime = 5000;
    } finally {
      run.later(() => this.updateLoop(), updateTime);
    }
  }

  async stop(name, signal) {
    const data = await this.request("stop", { name, signal });
    return this.createOrUpdate(data);
  }

  async stopAll() {
    const data = await this.request("stopAll");
    this.updateAll(data);
  }

  async start(name) {
    const data = await this.request("start", { name });
    return this.createOrUpdate(data);
  }

  async startAll() {
    const data = await this.request("startAll");
    this.updateAll(data);
  }

  async restart(name) {
    const data = await this.request("restart", { name });
    return this.createOrUpdate(data);
  }

  async restartAll() {
    const data = await this.request("restartAll");
    return this.updateAll(data);
  }

  async sendCommand(name, command) {
    const data = await this.request("sendCommand", { name, command });
    return this.createOrUpdate(data);
  }

  request(command, value) {
    return ipcRenderer.invoke(command, value);
  }

  async updateAll(data) {
    if (!data) {
      data = await this.request("getAll");
    }

    let allRecordsExisted = true;
    const newRecords = data.map(record => {
      if (!this.itemMap[record.name]) {
        allRecordsExisted = false;
      }
      return this.createOrUpdate(record);
    });

    if (this.list.length !== data.length || !allRecordsExisted) {
      this.list = newRecords;
    }

    return newRecords;
  }

  createOrUpdate(attrs) {
    let newProcess;
    let key = attrs.name;
    let prior = this.itemMap[key];
    if (prior) {
      prior.setProperties(attrs);
      newProcess = prior;
    } else {
      newProcess = new Process(attrs);
      this.itemMap[key] = newProcess;
    }
    return newProcess;
  }
}
