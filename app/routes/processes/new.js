import Ember from 'ember';

const { get, inject } = Ember;

export default Ember.Route.extend({
  processes: inject.service(),

  actions: {
    createProcess(name, command) {
      get(this, "processes").request('create', [name, command], () => {
        this.transitionTo('process', name);
      });
    }
  }
});
