import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('processes', function() {
    this.route('new');
  });
  this.route('process', { path: '/processes/:name' });
});

export default Router;
