import Ember from 'ember';

const { computed } = Ember;

export default Ember.Object.extend({
  alive: computed.equal('state', 'alive')
});
