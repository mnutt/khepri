import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { get } from '@ember/object';

export default Component.extend({
  processes: service(),

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
