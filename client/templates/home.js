var FEATURED_COUNT = 4;

Template.home.helpers({
  // selects FEATURED_COUNT number of recipes at random
  featuredRecipes: function() {
    var recipes = _.values(RecipesData);
    var selection = [];
    
    for (var i = 0;i < FEATURED_COUNT;i++)
      selection.push(recipes.splice(_.random(recipes.length - 1), 1)[0]);

    return selection;
  },
  
  activities: function() {
    return Stream.feeds.flat.find({}, { limit: 3, sort: { date: -1 } });
  },

  ready: function() {
    return Router.current().feedSubscription.ready();
  },
  
  latestNews: function() {
    return News.latest();
  }
});