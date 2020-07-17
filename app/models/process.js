import { tracked } from "@glimmer/tracking";

export default class Process {
  @tracked state;
  @tracked pid;
  @tracked cmd;
  @tracked log;
  @tracked uptime;
  @tracked name;

  constructor({ name, cmd, state, pid, log, uptime }) {
    this.name = name;
    this.cmd = cmd;
    this.state = state;
    this.pid = pid;
    this.log = log;
    this.uptime = uptime;
  }

  setProperties(attrs) {
    Object.assign(this, attrs);
  }

  get stopped() {
    return this.state === "stopped";
  }

  get alive() {
    return this.state === "alive";
  }
}

/* const { ipcRenderer } = requireNode("electron");
 * const spawn = window.requireNode("child_process").spawn;
 * const AnsiUp = window.requireNode("ansi_up");
 *
 * const ansi = new AnsiUp.default();
 * ansi.use_classes = true;
 *
 * function endOfFile(path, lineCount, cb) {
 *   let tail = spawn("tail", [`-${lineCount}f`, path]);
 *
 *   tail.stdout.on("data", data => cb(null, data.toString("utf8")));
 *   tail.on("error", cb);
 *
 *   return tail;
 * }
 *
 * export default EmberObject.extend({
 *   history: 1000,
 *   alive: equal("state", "alive"),
 *   stopped: equal("state", "stopped"),
 *   tail: null,
 *   data: null,
 *   newData: null, // buffer of new log data, used to debounce formatting calls
 *
 *   init() {
 *     this._super(...arguments);
 *     this.set("data", []);
 *     this.set("newData", []);
 *   },
 *
 *   fillHistorical() {
 *     this.tearDownTail();
 *
 *     this.set("data", []);
 *
 *     let path = this.log;
 *     let history = this.history;
 *     let newData = this.newData;
 *
 *     this.tail = endOfFile(path, history, (err, stdout) => {
 *       newData.push(stdout);
 *       run.throttle(this, this.formatNewData, 100, false);
 *     });
 *
 *     // main process records pid for cleanup in event of hard exit
 *     ipcRenderer.send("tailPid", this.tail.pid);
 *   },
 *
 *   tearDownTail() {
 *     if (this.tail) {
 *       this.tail.kill("SIGTERM");
 *       this.tail = null;
 *     }
 *   },
 *
 *   formatNewData() {
 *     let newData = this.format(this.newData.join(""));
 *     this.data.pushObject(newData);
 *     this.newData.clear();
 *   },
 *
 *   format(lines) {
 *     let htmlified = ansi.ansi_to_html(lines);
 *
 *     return htmlified.replace(/=== monitor starting ===/, "<hr>");
 *   }
 * }); */
