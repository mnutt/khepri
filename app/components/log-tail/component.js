import Component from '@ember/component';
import { set, get } from '@ember/object';
import { run, throttle } from '@ember/runloop';

export default Component.extend({
  classNames: ['log-tail'],
  data: '',

  // If user scrolls up, stop following tail
  didInsertElement() {
    const setFollow = () => {
      const atBottom = this.element.clientHeight + this.element.scrollTop >= this.element.scrollHeight;

      set(this, 'follow', atBottom);
    };

    this._scrollListener = () => {
      run(this, setFollow);
    };

    this.element.addEventListener('scroll',
                                  this._scrollListener,
                                  { passive: true });
  },

  willDestroyElement() {
    if (this._scrollListener) {
      this.element.removeEventListener(this._scrollListener);
    }
  },

  didUpdate() {
    this._super(...arguments);

    throttle(this, function() {
      if(!get(this, 'follow')) { return; }
      if(this.element) { this.element.scrollTop = 10e8; }
    }, 20, false);
  }
});
