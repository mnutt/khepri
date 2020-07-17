import Component from "@glimmer/component";
import { action } from "@ember/object";
import { FitAddon } from "xterm-addon-fit";

const spawn = window.requireNode("child_process").spawn;

function endOfFile(path, byteCount, cb) {
  let tail = spawn("tail", [`-c${byteCount}`, "-f", path]);

  tail.stdout.on("data", chunk => cb(null, chunk.toString("utf8")));
  tail.on("error", cb);

  return tail;
}

export default class LogTailComponent extends Component {
  buffering = false;

  get terminal() {
    return this.args.terminal;
  }

  // If user scrolls up, stop following tail
  @action attachTerminal(element) {
    const fitAddon = new FitAddon();
    this.terminal.loadAddon(fitAddon);

    this.terminal.open(element);

    //this.terminal.onScroll((...args) => console.log(...args));

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
    console.log("DOING OUR THING");

    this.tail = endOfFile(this.args.model.log, 500000, (err, stdout) => {
      if (this.buffering) {
        this._buffer += stdout;
      } else {
        this.terminal.write(stdout);
        if (this.follow) {
          this.terminal.scrollToBottom();
        }
      }
    });

    this.bufferingTimeout = setTimeout(() => {
      this.buffering = false;
      this.terminal.write(this._buffer);
      this._buffer = null;
    }, 50);
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
