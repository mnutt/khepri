import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
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
