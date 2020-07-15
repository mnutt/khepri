import { inject as service } from '@ember/service';
import Component from '@ember/component';
import { get } from '@ember/object';

export default Component.extend({
  processes: service(),

  classNames: ['pane', 'pane-sm', 'sidebar', 'process-list'],

  actions: {
    stop(name) {
      this.processes.stop(name, 'SIGTERM');
    },

    stopAll() {
      this.processes.stopAll();
    },

    start(name) {
      this.processes.start(name);
    },

    startAll() {
      this.processes.startAll();
    },

    restart(name) {
      this.processes.restart(name);
    },

    restartAll() {
      this.processes.restartAll();
    }
  }
});
