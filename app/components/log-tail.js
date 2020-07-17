import Component from "@glimmer/component";
import { action } from "@ember/object";
import { FitAddon } from "xterm-addon-fit";
import { inject as service } from "@ember/service";

const spawn = window.requireNode("child_process").spawn;

function endOfFile(path, byteCount, cb) {
  let tail = spawn("tail", [`-c${byteCount}`, "-f", path]);

  tail.stdout.on("data", chunk => cb(null, chunk.toString("utf8")));
  tail.on("error", cb);

  return tail;
}

export default class LogTailComponent extends Component {
  @service processes;
  buffering = false;

  get terminal() {
    return this.args.terminal;
  }

  @action attachTerminal(element) {
    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);

    this.terminal.open(element);
    this.terminal.onData(d => this.sendCommand(d));

    fitAddon.fit();
    new ResizeObserver(() => fitAddon.fit()).observe(element);

    this.startTail();
  }

  @action startTail() {
    if (this.tail) {
      this.tail.kill("SIGTERM");
      this.tail = null;
    }

    this.terminal.clear();
    this.buffering = true;
    this._buffer = "";

    this.tail = endOfFile(this.args.model.log, 500000, (err, stdout) => {
      if (err) {
        this.terminal.write("Failed to watch process log");
      }

      if (this.buffering) {
        this._buffer += stdout;
      } else {
        this.terminal.write(stdout);
        if (this.args.follow) {
          this.terminal.scrollToBottom();
        }
      }
    });

    // Register this tail process with main, so that it can kill it
    // if we crash
    this.processes.request("tailPid", this.tail.pid);

    this.bufferingTimeout = setTimeout(() => {
      this.buffering = false;
      this.terminal.write(this._buffer);
      this._buffer = null;
    }, 50);
  }

  @action tailNewProcess() {
    if (this.tail && this.tail.exitCode && this.args.model.state === "alive") {
      this.startTail();
    }
  }

  sendCommand(data) {
    this.processes.sendCommand(this.args.model.name, data);
  }

  willDestroy() {
    if (this.terminal) {
      this.terminal.dispose();
    }

    if (this.tail) {
      this.tail.kill("SIGTERM");
      this.tail = null;
    }

    clearTimeout(this.bufferingTimeout);
  }
}
