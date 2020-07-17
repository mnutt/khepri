import Component from "@glimmer/component";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";

export default class ProcessListComponent extends Component {
  @service processes;

  @action stop(name) {
    this.processes.stop(name, "SIGTERM");
  }

  @action stopAll() {
    this.processes.stopAll();
  }

  @action start(name) {
    this.processes.start(name);
  }

  @action startAll() {
    this.processes.startAll();
  }

  @action restart(name) {
    this.processes.restart(name);
  }

  @action restartAll() {
    this.processes.restartAll();
  }
}
