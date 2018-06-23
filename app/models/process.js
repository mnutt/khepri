/* global requireNode */

import Ember from 'ember';

const { get, set, computed, run } = Ember;

const spawn = requireNode('child_process').spawn;
const AnsiUp = requireNode('ansi_up');
const Client = requireNode('electron-rpc/client');

const ansi = new AnsiUp.default;
ansi.use_classes = true;

const client = new Client();

function endOfFile(path, lineCount, cb) {
  let tail = spawn('tail', [`-${lineCount}f`, path]);

  tail.stdout.on('data', (data) => cb(null, data.toString('utf8')));
  tail.on('error', cb);

  return tail;
}

export default Ember.Object.extend({
  history: 1000,
  alive: computed.equal('state', 'alive'),
  stopped: computed.equal('state', 'stopped'),
  tail: null,

  data: [],
  newData: [], // buffer of new log data, used to debounce formatting calls

  fillHistorical() {
    this.tearDownTail();

    set(this, 'data', []);

    let path = get(this, 'log');
    let history = get(this, 'history');
    let newData = get(this, 'newData');

    this.tail = endOfFile(path, history, (err, stdout) => {
      newData.push(stdout);
      run.throttle(this, this.formatNewData, 100, false);
    });

    // main process records pid for cleanup in event of hard exit
    client.request('tail-pid', this.tail.pid);
  },

  tearDownTail() {
    if(this.tail) {
      this.tail.kill('SIGTERM');
      this.tail = null;
    }
  },

  formatNewData() {
    let newData = this.format(get(this, 'newData').join(''));
    get(this, 'data').pushObject(newData);
    get(this, 'newData').clear();
  },

  format(lines) {
    let htmlified = ansi.ansi_to_html(lines);

    return htmlified.replace(/=== monitor starting ===/, '<hr>');
  }
});
