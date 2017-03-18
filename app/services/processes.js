import Ember from 'ember';
import Process from 'khepri/models/process';

const { get, set, run, RSVP } = Ember;

const Client = requireNode('electron-rpc/client');

export default Ember.Service.extend({
  client: null,
  list: [],
  itemMap: {},

  init() {
    this.client = new Client();
    this.updateLoop();
  },

  find(name) {
    let item = get(this, `itemMap.${name}`);
    if(item) {
      return Ember.RSVP.cast(item);
    } else {
      return this.update().then(() => {
        return get(this, `itemMap.${name}`);
      });
    }
  },

  updateLoop() {
    this.update().then(() => {
      run.later(() => {
        this.updateLoop();
      }, 1000);
    }).catch((err) => {
      console.log("Service update error", err);
      run.later(() => {
        this.updateLoop();
      }, 5000);
    });
  },

  stop(name, signal) {
    return this.execTask({task: 'stop', name, signal}).then((data) => {
      return this.createOrUpdate(data);
    });
  },

  stopAll() {
    get(this, 'list').forEach((process) => {
      this.stop(process.name, 'SIGTERM');
    });
  },

  start(name) {
    return this.execTask({task: 'start', name}).then((data) => {
      return this.createOrUpdate(data);
    });
  },

  startAll() {
    get(this, 'list').forEach((process) => {
      this.start(process.name);
    });
  },

  restart(name) {
    return this.execTask({task: 'restart', name}).then((data) => {
      return this.createOrUpdate(data);
    });
  },

  restartAll() {
    get(this, 'list').forEach((process) => {
      this.restart(process.name);
    });
  },

  request(command, value, callback) {
    return this.client.request(command, value, callback);
  },

  execTask(task) {
    return new RSVP.Promise((resolve, reject) => {
      this.request('task', task, (err, data) => {
        if (err) { reject(err); }
        if (!data) { resolve(null); }

        resolve(data);
      });
    });
  },

  update() {
    return new RSVP.Promise((resolve, reject) => {
      this.request('get-all', (err, data) => {
        if(err) { return reject(err); }

        let newRecords = data.map((record) => {
          return this.createOrUpdate(record);
        });

        set(this, 'list', newRecords);
        resolve(newRecords);
      });
    });
  },

  createOrUpdate(attrs) {
    let newProcess;
    let key = attrs.name;
    let prior = get(this, `itemMap.${key}`);
    if(prior) {
      prior.setProperties(attrs);
      newProcess = prior;
    } else {
      newProcess = Process.create(attrs);
      set(this, `itemMap.${key}`, newProcess);
    }
    return newProcess;
  }
});
