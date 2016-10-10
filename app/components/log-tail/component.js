import Ember from 'ember';

const { get, set, observer, on, run } = Ember;

export default Ember.Component.extend({
  classNames: ['log-tail'],
  data: '',

  // If user scrolls up, stop following tail
  bindScrollUpwards: on('didInsertElement', function() {
    this.$().get(0).addEventListener('mousewheel', (e) => {
      if(e.deltaY >= 0) { return; } // ignore scroll down

      run.once(this, () => set(this, 'follow', false));
    }, {passive: true});
  }),

  scrollToBottom: observer('data.length', 'follow', function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      if(!get(this, 'follow')) { return; }

      let el = this.$().get(0);
      if(el) { el.scrollTop = 10e8; }
    });
  })
});
