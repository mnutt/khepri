import Component from '@ember/component';
import { observer, set, get } from '@ember/object';
import { run, scheduleOnce } from '@ember/runloop';

export default Component.extend({
  classNames: ['log-tail'],
  data: '',

  // If user scrolls up, stop following tail
  didInsertElement() {
    const setFollow = () => {
      const atBottom = this.element.clientHeight + this.element.scrollTop >= this.element.scrollHeight;

      set(this, 'follow', atBottom);
    };

    this.element.addEventListener('scroll', () => {
      run(this, setFollow);
    }, { passive: true });
  },

  scrollToBottom: observer('data.length', 'follow', function() {
    scheduleOnce('afterRender', this, () => {
      if(!get(this, 'follow')) { return; }

      let el = this.$().get(0);
      if(el) { el.scrollTop = 10e8; }
    });
  })
});
