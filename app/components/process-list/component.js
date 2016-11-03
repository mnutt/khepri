import Ember from 'ember';

const { get, inject } = Ember;

export default Ember.Component.extend({
  processes: inject.service(),

  classNames: ['pane', 'pane-sm', 'sidebar', 'process-list'],

  actions: {
    stop(name) {
      get(this, 'processes').stop(name, 'SIGTERM');
    },

    stopAll() {
      get(this, 'processes').stopAll();
    },

    start(name) {
      get(this, 'processes').start(name);
    },

    startAll() {
      get(this, 'processes').startAll();
    },

    restart(name) {
      get(this, 'processes').restart(name);
    },

    restartAll() {
      get(this, 'processes').restartAll();
    }
  }
});
