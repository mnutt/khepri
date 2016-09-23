import Ember from 'ember';

const { inject } = Ember;

export default Ember.Component.extend({
  processes: inject.service(),

  classNames: ['pane', 'pane-sm', 'sidebar', 'process-list']
});
