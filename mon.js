#!/usr/bin/env node

var fs       = require('fs');
var pty      = require('pty.js');
var spawn    = require('child_process').spawn;
var minimist = require('minimist');

var argv = require('minimist')(process.argv.slice(2));

var cmd       = argv._.join(' ');
var pidfile   = argv.p || argv.pidfile;
var mpidfile  = argv.m || argv['mon-pidfile'];
var daemonize = argv.d || argv.daemonize;
var logfile   = argv.l || argv.log;
var sleep     = parseInt(argv.s || argv.sleep) || 1;
var attempts  = parseInt(argv.a || argv.attempts) || 3;
var marker    = argv.k || argv.marker;

if(daemonize) {
  console.log('daemonizing', process.pid);
  require('daemon')();
}

if(mpidfile) {
  fs.writeFileSync(mpidfile, process.pid);
}

var bashStuff = [
  "trap 'kill $(jobs -p)' EXIT",
  cmd
].join('\n');

var term, firstAttemptTime;
var attemptCount = 0;

function startProcess() {
  term = pty.spawn('bash', ["-c", bashStuff], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  var out = logfile ? fs.createWriteStream(logfile, {flags: "a"}) : process.stdout;

  out.write("=== mon starting ===\n");

  term.pipe(out);

  if(pidfile) {
    fs.writeFileSync(pidfile, term.pid);
  }

  term.on('exit', processDied);
}

function processDied(code, signal) {
  console.log("process died", code);
  if(attemptCount === 0) {
    firstAttemptTime = new Date();
  }

  attemptCount += 1;

  var timeSinceFirstAttempt = new Date() - firstAttemptTime;

  if(timeSinceFirstAttempt < 60000 && attemptCount >= attempts) {
    var timeUntilNextAttempt = 60000 - timeSinceFirstAttempt;
    attemptCount = 0;

    setTimeout(startProcess, timeUntilNextAttempt);
  } else {
    var sleepTime = sleep * 1000;
    setTimeout(startProcess, sleepTime);
  }
}

startProcess();

function waitForChildExit(signal) {
  if(term.readable) {
    console.log("killing child", term.pid);
    process.kill(term.pid, 'SIGTERM');
  }
  var killTries = 0;

  function checkForDead() {
    if(killTries > 30) {
      console.log("hard killing child", term.pid);
      process.kill(term.pid, 'SIGKILL');
      process.exit(1);
    } else if(term.readable) {
      killTries+=1;
      console.log("waiting for child to die", killTries);
      setTimeout(checkForDead, 1000);
    } else {
      console.log("child died, exiting");
      process.exit(0);
    }
  }
  checkForDead();
}

process.on('SIGTERM', waitForChildExit);
process.on('SIGQUIT', waitForChildExit);
process.on('SIGINT', waitForChildExit);
