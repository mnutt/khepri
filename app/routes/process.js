import { inject as service } from "@ember/service";
import Route from "@ember/routing/route";

export default Route.extend({
  processes: service(),

  model(params) {
    return this.processes.find(params.name);
  },

  actions: {
    willTransition() {
      this.set("controller.follow", true);
    },

    fireCommandToProcess(cmd) {
      this.processes.sendCommand(this.currentModel.name, cmd);
    }
  }
});
