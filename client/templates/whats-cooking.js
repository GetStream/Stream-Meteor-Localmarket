Template.feed.helpers({
  activities: function() {
    return Stream.feeds.flat.find({}, { sort: { date: -1 }}); 
  },
  ready: function() {
    return Router.current().feedSubscription.ready();
  }
});