Template.feed.helpers({
  activities: function() {
    return Stream.feeds.flat.find({}); 
  },
  ready: function() {
    return Router.current().feedSubscription.ready();
  }
});