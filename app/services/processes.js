import Ember from 'ember';
import Process from 'accord/models/process';

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
      return item;
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
      console.log(err);
      run.later(() => {
        this.updateLoop();
      }, 5000);
    });
  },

  update() {
    return new RSVP.Promise((resolve, reject) => {
      this.client.request('get-all', (err, data) => {
        if(err) { return reject(err); }

        let newItems = data.map((item) => {
          let newItem;
          let key = item.name;
          let prior = get(this, `itemMap.${key}`);
          if(prior) {
            prior.setProperties(item);
            newItem = prior;
          } else {
            newItem = Process.create(data);
            set(this, `itemMap.${key}`, newItem);
          }
          return newItem;
        });

        set(this, 'list', newItems);
        resolve(newItems);
      });
    });
  }
});
