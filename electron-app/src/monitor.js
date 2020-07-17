const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const pty = require("node-pty");
const ms = require("ms");

// Chalk won't colorize unless we force it to
process.env.FORCE_COLOR = 2;
const chalk = require("chalk");

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
    return new Promise(resolve => {
      if (this.state === "alive") {
        return resolve();
      }

      this.term = pty.spawn("bash", ["-c", this.bashCommand], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: {
          TERM: "xterm-256color"
        }
      });

      this.state = "alive";
      this.startTime = new Date();

      this.out = fs.createWriteStream(this.logfile, { flags: "a" });
      this.out.write("\r\n");
      this.out.write(
        chalk.black.bgWhite("=== monitor starting process ===\r\n")
      );
      this.out.write(chalk.blue(`Command: ${this.command}\r\n`));
      this.out.write("\r\n");

      this.term.pipe(this.out);
      this.term.on("exit", this.processDied.bind(this));

      resolve();
    });
  }

  stop() {
    return new Promise(resolve => {
      if (this.state !== "alive") {
        if (this.startTimer) {
          clearTimeout(this.startTimer);
        }
        return resolve();
      }

      if (this.out) {
        this.out.write("\r\n");
        this.out.write(
          chalk.black.bgWhite("=== monitor stopping process ===\r\n\r\n")
        );
        this.out.write("\r\n");
      }

      this.state = "stopping";

      const hardKill = setTimeout(() => {
        this.term.kill("SIGKILL");
      }, 30 * 1000);

      this.term.on("exit", function() {
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
    return new Promise(resolve => {
      if (this.state !== "alive") {
        return resolve();
      }

      return resolve(this.term.write(command));
    });
  }

  processDied() {
    if (this.state !== "alive") {
      return;
    }

    this.state = "dead";

    if (this.attemptCount === 0) {
      this.firstAttemptTime = new Date();
    }

    this.attemptCount += 1;

    this.out = fs.createWriteStream(this.logfile, { flags: "a" });
    this.out.write("\r\n");
    this.out.write(chalk.white.bgRed("=== process died unexpectedly ===\r\n"));
    this.out.write("\r\n");
    this.out.close();

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
