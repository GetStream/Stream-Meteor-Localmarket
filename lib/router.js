var feedSubscription;

// Handle for launch screen possibly dismissed from app-body.js
dataReadyHold = null;

// Global subscriptions
if (Meteor.isClient) {
  Meteor.subscribe('news');
  Meteor.subscribe('bookmarkCounts');

  Tracker.autorun(function() {
    feedSubscription = Meteor.subscribe('Stream.feeds.flat', 20, Meteor.userId());  
  });
}

Router.configure({
  layoutTemplate: 'appBody',
  notFoundTemplate: 'notFound',
});

if (Meteor.isClient) {
  // Keep showing the launch screen on mobile devices until we have loaded
  // the app's data
  dataReadyHold = LaunchScreen.hold();
}

HomeController = RouteController.extend({
  onBeforeAction: function () {
    this.feedSubscription = feedSubscription;
  }
});

FeedController = RouteController.extend({
  onBeforeAction: function () {
    this.feedSubscription = feedSubscription;
  }
});

RecipesController = RouteController.extend({
  data: function () {
    return _.values(RecipesData);
  }
});

BookmarksController = RouteController.extend({
  onBeforeAction: function () {
    if (Meteor.user())
      Meteor.subscribe('bookmarks');
    else
      Overlay.open('authOverlay');
  },
  data: function () {
    if (Meteor.user())
      return _.values(_.pick(RecipesData, Meteor.user().bookmarkedRecipeNames));
  }
});

RecipeController = RouteController.extend({
  onBeforeAction: function () {
    Meteor.subscribe('recipe', this.params.name);
  },
  data: function () {
    return RecipesData[this.params.name];
  }
});

AdminController = RouteController.extend({
  onBeforeAction: function () {
    Meteor.subscribe('news');
  }
});

Router.route('home', {
  path: '/'
});

Router.route('feed');

Router.route('recipes');

Router.route('bookmarks');

Router.route('about');

Router.route('people', {
  waitOn: function () {
    return [
      Meteor.subscribe('users', Session.get('people_limit')),
      Meteor.subscribe('follows'),
    ];
  },

  data: function() {
    var users = Meteor.users.find({}).fetch();

    users.forEach(function(user) {
      user.followed = Follows.find({ target: user._id }).count() > 0;
    });

    return users;
  },

  action: function() {
    if(this.ready()) {
      this.render('people', this.data());
    } else {
      this.render('loading');
    }
  }
});

Router.route('recipe', {
  path: '/recipes/:name'
});

Router.route('admin', {
  layoutTemplate: null
});

Router.onBeforeAction('dataNotFound', {
  only: 'recipe'
});
