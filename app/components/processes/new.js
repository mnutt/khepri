import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class ProcessesNewComponent extends Component {
  @service processes;
  @service router;

  @tracked name = "";
  @tracked command = "";

  @action async create() {
    if (!this.name.length) {
      alert("Process must have a name");
      return;
    }

    await this.processes.request("create", {
      name: this.name,
      command: this.command
    });
    this.router.transitionTo("process", this.name);
  }
}
