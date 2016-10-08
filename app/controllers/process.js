import Ember from 'ember';

const { set } = Ember;

export default Ember.Controller.extend({
  data: '',

  actions: {
    clear() {
      set(this, 'model.data', '');
    }
  }
});
