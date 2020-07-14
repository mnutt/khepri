/* global requireNode */

import { equal } from "@ember/object/computed";

import EmberObject, { set, get } from "@ember/object";
import { run } from "@ember/runloop";

const { ipcRenderer } = requireNode("electron");
const spawn = window.requireNode("child_process").spawn;
const AnsiUp = window.requireNode("ansi_up");

const ansi = new AnsiUp.default();
ansi.use_classes = true;

function endOfFile(path, lineCount, cb) {
  let tail = spawn("tail", [`-${lineCount}f`, path]);

  tail.stdout.on("data", data => cb(null, data.toString("utf8")));
  tail.on("error", cb);

  return tail;
}

export default EmberObject.extend({
  history: 1000,
  alive: equal("state", "alive"),
  stopped: equal("state", "stopped"),
  tail: null,
  data: null,
  newData: null, // buffer of new log data, used to debounce formatting calls

  init() {
    this._super(...arguments);
    set(this, "data", []);
    set(this, "newData", []);
  },

  fillHistorical() {
    this.tearDownTail();

    set(this, "data", []);

    let path = get(this, "log");
    let history = get(this, "history");
    let newData = get(this, "newData");

    this.tail = endOfFile(path, history, (err, stdout) => {
      newData.push(stdout);
      run.throttle(this, this.formatNewData, 100, false);
    });

    // main process records pid for cleanup in event of hard exit
    ipcRenderer.send("tail-pid", this.tail.pid);
  },

  tearDownTail() {
    if (this.tail) {
      this.tail.kill("SIGTERM");
      this.tail = null;
    }
  },

  formatNewData() {
    let newData = this.format(get(this, "newData").join(""));
    get(this, "data").pushObject(newData);
    get(this, "newData").clear();
  },

  format(lines) {
    let htmlified = ansi.ansi_to_html(lines);

    return htmlified.replace(/=== monitor starting ===/, "<hr>");
  }
});
