import Ember from 'ember';

const { set } = Ember;

export default Ember.Controller.extend({
  follow: true,

  actions: {
    clear() {
      set(this, 'model.data', []);
    },

    toggleFollow() {
      this.toggleProperty('follow');
    }
  }
});
