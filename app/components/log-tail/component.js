import Ember from 'ember';

const { get, set } = Ember;

const exec = requireNode('child_process').exec;
const ansiUp = requireNode('ansi_up');

function endOfFile(path, lineCount, cb) {
  console.log("RUNNING EXEC");
  exec(`tail -${lineCount} "${path}"`, cb);
}

export default Ember.Component.extend({
  classNames: ['log-tail'],
  data: '',

  fillHistorical: Ember.observer('path', function() {
    this._super(...arguments);

    let path = get(this, 'path');
    console.log(path);

    endOfFile(path, 500, (err, stdout) => {
      let formatted = ansiUp.ansi_to_html(ansiUp.escape_for_html(stdout), {
        use_classes: true
      });
      console.log('got data');
      set(this, 'data', formatted);
      Ember.run.scheduleOnce('afterRender', this, this.scrollToBottom);
    });
  }).on('init'),

  scrollToBottom() {
    let el = this.$().get(0);
    if(el) { el.scrollTop = 10e8; }
  }
});
