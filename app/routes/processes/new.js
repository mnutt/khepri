import { inject as service } from "@ember/service";
import Route from "@ember/routing/route";

export default Route.extend({
  processes: service(),

  actions: {
    async createProcess(name, command) {
      await this.processes.request("create", { name, command });
      this.transitionTo("process", name);
    }
  }
});
