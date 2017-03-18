import Ember from 'ember';

const { get, set } = Ember;

export default Ember.Controller.extend({
  follow: true,

  actions: {
    clear() {
      set(this, 'model.data', []);
    },

    toggleFollow() {
      this.toggleProperty('follow');
    },

    fireCommand() {
      this.send('fireCommandToProcess', get(this, 'model.command'));
      set(this, 'model.command', null);
    }
  }
});
