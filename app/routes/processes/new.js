import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { get } from '@ember/object';

export default Route.extend({
  processes: service(),

  actions: {
    createProcess(name, command) {
      this.processes.request('create', [name, command], () => {
        this.transitionTo('process', name);
      });
    }
  }
});
