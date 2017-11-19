import Ember from 'ember';

const { get, set, observer, on, run } = Ember;

export default Ember.Component.extend({
  classNames: ['log-tail'],
  data: '',

  // If user scrolls up, stop following tail
  bindScrollUpwards: on('didInsertElement', function() {
    const setFollow = () => {
      const atBottom = this.element.clientHeight + this.element.scrollTop >= this.element.scrollHeight;

      set(this, 'follow', atBottom);
    };

    this.element.addEventListener('scroll', () => {
      run(this, setFollow);
    }, { passive: true });
  }),

  scrollToBottom: observer('data.length', 'follow', function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      if(!get(this, 'follow')) { return; }

      let el = this.$().get(0);
      if(el) { el.scrollTop = 10e8; }
    });
  })
});
