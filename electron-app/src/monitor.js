const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const pty = require("node-pty");
const RSVP = require("rsvp");
const ms = require("ms");

class Monitor extends EventEmitter {
  constructor(args) {
    super(...arguments);
    this.name = args.name;
    this.command = args.command;
    this.conf = args.conf;
    this.logfile = path.join(this.conf.logs, this.name + ".log");
    this.state = "stopped";
    this.conf.sleepTime = this.conf.sleepTime || 1000;
    this.conf.attempts = this.conf.attempts || 3;
    this.attemptCount = 0;

    this.startTimer = null;
    this.startTime = null;
    this.term = null;
    this.out = null;
  }

  uptime() {
    if (this.state === "alive") {
      return new Date() - this.startTime;
    } else {
      return null;
    }
  }

  getStatus() {
    return {
      cmd: this.command,
      name: this.name,
      state: this.state,
      pid: this.pid,
      log: this.logfile,
      uptime: this.uptimeDescription
    };
  }

  get uptimeDescription() {
    return ms(parseInt(this.uptime()) || 0, { long: true });
  }

  get bashCommand() {
    return ["trap 'pkill -TERM -P ${$}' EXIT", this.command].join("\n");
  }

  get pid() {
    return this.term && this.term.pid;
  }

  start() {
    return new RSVP.Promise((resolve, reject) => {
      if (this.state === "alive") {
        return resolve();
      }

      this.term = pty.spawn("bash", ["-c", this.bashCommand], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
      });

      this.state = "alive";
      this.startTime = new Date();

      this.out = fs.createWriteStream(this.logfile, { flags: "a" });
      this.out.write("=== monitor starting ===\n");

      this.term.pipe(this.out);
      this.term.on("exit", this.processDied.bind(this));

      resolve();
    });
  }

  stop() {
    return new RSVP.Promise((resolve, reject) => {
      if (this.state !== "alive") {
        if (this.startTimer) {
          clearTimeout(this.startTimer);
        }
        return resolve();
      }

      if (this.out) {
        this.out.write("=== monitor stopping process ===\n");
      }

      this.state = "stopping";

      var hardKill = setTimeout(() => {
        this.term.kill("SIGKILL");
      }, 30 * 1000);

      this.term.on("exit", function(code, signal) {
        clearTimeout(hardKill);
        resolve(true);
      });

      this.term.kill("SIGTERM");
    }).then(() => {
      return (this.state = "stopped");
    });
  }

  restart() {
    return this.stop().then(() => {
      return this.start();
    });
  }

  sendCommand(command) {
    return new RSVP.Promise((resolve, reject) => {
      if (this.state !== "alive") {
        return resolve();
      }

      return resolve(this.term.write(command + "\r"));
    });
  }

  processDied(code, signal) {
    if (this.state !== "alive") {
      return;
    }

    this.state = "dead";

    if (this.attemptCount === 0) {
      this.firstAttemptTime = new Date();
    }

    this.attemptCount += 1;

    var timeSinceFirstAttempt = new Date() - this.firstAttemptTime;

    if (
      timeSinceFirstAttempt < 60000 &&
      this.attemptCount >= this.conf.attempts
    ) {
      var timeUntilNextAttempt = 60000 - timeSinceFirstAttempt;
      this.attemptCount = 0;

      this.startTimer = setTimeout(this.start.bind(this), timeUntilNextAttempt);
    } else {
      this.startTimer = setTimeout(this.start.bind(this), this.conf.sleepTime);
    }
  }
}

module.exports = Monitor;
