import Ember from 'ember';

const { get, inject } = Ember;

export default Ember.Component.extend({
  processes: inject.service(),

  classNames: ['pane', 'pane-sm', 'sidebar', 'process-list'],

  actions: {
    stop(name) {
      get(this, 'processes').stop(name, 'SIGTERM');
    },

    start(name) {
      get(this, 'processes').start(name);
    },

    restart(name) {
      get(this, 'processes').restart(name);
    }
  }
});
