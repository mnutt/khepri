import Ember from 'ember';

const { get, set, on } = Ember;

const spawn = requireNode('child_process').spawn;
const ansiUp = requireNode('ansi_up');

function endOfFile(path, lineCount, cb) {
  console.log('linecount', lineCount);
  let tail = spawn('tail', [`-${lineCount}f`, path]);

  tail.stdout.on('data', (data) => cb(null, data.toString('utf8')));
  tail.on('error', cb);

  return tail;
}

export default Ember.Component.extend({
  classNames: ['log-tail'],
  data: '',
  tail: null,
  history: 5000,

  fillHistorical: on('willInsertElement', function() {
    this.tearDownTail();

    set(this, 'data', '');

    let path = get(this, 'path');
    let history = get(this, 'history');

    this.tail = endOfFile(path, history, (err, stdout) => {
      console.log("more data", path);
      set(this, 'data', get(this, 'data') + this.format(stdout));
      Ember.run.scheduleOnce('afterRender', this, this.scrollToBottom);
    });
  }).observes('path'),

  tearDownTail: on('willDestroyElement', function() {
    console.log("CLOSING");
    if(this.tail) {
      this.tail.kill('SIGTERM');
      this.tail = null;
    }
  }),

  scrollToBottom() {
    let el = this.$().get(0);
    if(el) { el.scrollTop = 10e8; }
  },

  format(lines) {
    let escaped = ansiUp.escape_for_html(lines);
    let htmlified = ansiUp.ansi_to_html(escaped, {
      use_classes: true
    });

    return htmlified.replace(/=== mon starting ===/, '<hr>');
  }
});
