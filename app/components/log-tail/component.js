import Ember from 'ember';

const { observer } = Ember;

export default Ember.Component.extend({
  classNames: ['log-tail'],
  data: '',

  scrollToBottom: observer('data', function() {
    Ember.run.scheduleOnce('afterRender', this, () => {
      let el = this.$().get(0);
      if(el) { el.scrollTop = 10e8; }
    });
  })
});
