import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { set, get } from '@ember/object';

export default Route.extend({
  processes: service(),

  model(params) {
    return this.processes.find(params.name).then((process) => {
      process.fillHistorical();
      return process;
    });
  },

  actions: {
    willTransition() {
      this.currentModel.tearDownTail();
      set(this, 'controller.follow', true);
    },

    fireCommandToProcess(cmd) {
      this.processes.sendCommand(this.currentModel.name, cmd);
    }
  }
});
