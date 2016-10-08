import Ember from 'ember';

const { get, inject } = Ember;

export default Ember.Route.extend({
  processes: inject.service(),

  model(params) {
    return get(this, 'processes').find(params.name).then((process) => {
      process.fillHistorical();
      return process;
    });
  },

  actions: {
    willTransition() {
      this.currentModel.tearDownTail();
    }
  }
});
