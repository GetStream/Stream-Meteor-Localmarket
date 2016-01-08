Activities = new Mongo.Collection('activities');

Activities.allow({
  insert: function(userId, doc) {
    return doc.userId === userId;
  }
});

Activities.latest = function() {
  return Activities.find({}, {sort: {date: -1}, limit: 1});
}

Stream.registerActivity(Activities, {
  activityVerb: 'cook',
  activityActorProp: 'userId',
});

Meteor.methods({
  createActivity: function(activity, tweet, loc) {
    check(Meteor.userId(), String);
    check(activity, {
      recipeName: String,
      text: String,
      image: String
    });
    check(tweet, Boolean);
    check(loc, Match.OneOf(Object, null));
    
    activity.userId = Meteor.userId();
    activity.userAvatar = Meteor.user().services.twitter.profile_image_url_https;
    activity.userName = Meteor.user().profile.name;
    activity.date = new Date;

    if (! this.isSimulation && loc && loc.coords)
      activity.place = getLocationPlace(loc);
    
    var id = Activities.insert(activity);
    
    if (! this.isSimulation && tweet)
      tweetActivity(activity);
    
    return id;
  }
});

if (Meteor.isServer) {
  var twitterOauth = function(options) {
    var config = Meteor.settings.twitter
    var userConfig = Meteor.user().services.twitter;

    return {
      consumer_key: config.consumerKey,
      consumer_secret: config.secret,
      token: userConfig.accessToken,
      token_secret: userConfig.accessTokenSecret
    };
  }
  
  var tweetActivity = function(activity) {
    // creates the tweet text, optionally truncating to fit the appended text
    function appendTweet(text, append) {
      var MAX = 117; // Max size of tweet with image attached
      
      if ((text + append).length > MAX)
        return text.substring(0, (MAX - append.length - 3)) + '...' + append;
      else
        return text + append;
    }
    
    // we need to strip the "data:image/jpeg;base64," bit off the data url
    var image = activity.image.replace(/^data.*base64,/, '');

    var response = HTTP.post(
      'https://upload.twitter.com/1.1/media/upload.json', {
        params: { media: image },
        npmRequestOptions: { oauth: twitterOauth() }
      }
    );
    
    if (response.statusCode !== 200)
      throw new Meteor.Error(500, 'Unable to post image to twitter');

    if (! response.data)
      throw new Meteor.Error(500, 'Did not receive attachment from twitter');

    var attachment = response.data;

    response = HTTP.post(
      'https://api.twitter.com/1.1/statuses/update.json', {
        params: {
          status: appendTweet(activity.text, ' #localmarket'),
          media_ids: attachment.media_id_string
        },
        npmRequestOptions: { oauth: twitterOauth() }
      }
    );

    if (response.statusCode !== 200)
      throw new Meteor.Error(500, 'Unable to create tweet');
  }
  
  var getLocationPlace = function(loc) {
    var url = 'https://api.twitter.com/1.1/geo/reverse_geocode.json'
      + '?granularity=neighborhood'
      + '&max_results=1'
      + '&accuracy=' + loc.coords.accuracy
      + '&lat=' + loc.coords.latitude
      + '&long=' + loc.coords.longitude;
    
    var response = HTTP.get(url,
                            {npmRequestOptions: { oauth: twitterOauth() } });

    if (response.statusCode === 200 && response.data) {
      var place = _.find(response.data.result.places, function(place) {
        return place.place_type === 'neighborhood';
      });
      
      return place && place.full_name;
    }
  }
}

// Initialize a seed activity
Meteor.startup(function() {
  var userIds = [];

  if(Meteor.isServer && Meteor.users.find().count() === 0) {
    var userId1 = Meteor.users.insert({
      username: 'matt',
      profile: {
        name: 'Matt Debergalis'
      },
      services: {
        twitter : {
          profile_image_url_https: 'https://avatars3.githubusercontent.com/u/204768?v=2&s=400'
        }
      }
    });

    var userId2 = Meteor.users.insert({
      username: 'john',
      profile: {
        name: 'John Doe',
      },
      services: {
        twitter: {
          profile_image_url_https: 'https://avatars3.githubusercontent.com/u/204769?v=2&s=400',
        }
      },
      bookmarkedRecipeNames: ['spring-animal-cracker-cookies']
    });

    var userId3 = Meteor.users.insert({
      username: 'ava',
      profile: {
        name: 'Ava Lovelace',
      },
      services: {
        twitter: {
          profile_image_url_https: 'https://avatars3.githubusercontent.com/u/204770?v=2&s=400',
        }
      },
      bookmarkedRecipeNames: ['summer-homemade-pasta-dough']
    });

    var userId4 = Meteor.users.insert({
      username: 'mason',
      profile: {
        name: 'Mason Born',
      },
      services: {
        twitter: {
          profile_image_url_https: 'https://avatars3.githubusercontent.com/u/204771?v=2&s=400',
        }
      },
      bookmarkedRecipeNames: []
    });

    var userId5 = Meteor.users.insert({
      username: 'luuk',
      profile: {
        name: 'Luuk Bywalker',
      },
      services: {
        twitter: {
          profile_image_url_https: 'https://avatars3.githubusercontent.com/u/204772?v=2&s=400',
        }
      },
      bookmarkedRecipeNames: ['spring-meatloaf','summer-shaking-beef']
    });

    userIds = [userId1, userId2, userId3, userId4, userId5];
  } 

  if (Meteor.isServer && Activities.find().count() === 0) {
    Activities.insert({
      userId: userIds[0],
      recipeName: 'summer-apricots-honey-panna-cotta',
      text: 'I substituted strawberries for apricots - incredible!',
      image: '/img/activity/activity-placeholder-strawberry-640x640.jpg',
      userAvatar: 'https://avatars3.githubusercontent.com/u/204768?v=2&s=400',
      userName: 'Matt Debergalis',
      place: 'SoMA, San Francisco',
      date: new Date
    });

    Activities.insert({
      userId: userIds[3],
      recipeName: 'spring-chicken-in-mole',
      text: 'I made this on a wrap - delicious!',
      image: '/img/activity/activity-mexican-chicken.jpg',
      userAvatar: 'https://avatars3.githubusercontent.com/u/204771?v=2&s=400',
      userName: 'Mason Born',
      place: 'SoHo, New York',
      date: new Date
    });

    Stream.feedManager.getUserFeed(userIds[1]).addActivity({
      'verb': 'bookmark',
      'actor': 'users:' + userIds[1],
      'object': 'spring-animal-cracker-cookies',
    })
      .catch(function(reason) { console.error('failed with reason', reason.error); });

    Stream.feedManager.getUserFeed(userIds[2]).addActivity({
      'verb': 'bookmark',
      'actor': 'users:' + userIds[2],
      'object': 'spring-animal-cracker-cookies',
    })
      .catch(function(reason) { console.error('failed with reason', reason.error); });

    Stream.feedManager.getUserFeed(userIds[4]).addActivity({
      'verb': 'bookmark',
      'actor': 'users:' + userIds[4],
      'object': 'spring-meatloaf',
    })
      .catch(function(reason) { console.error('failed with reason', reason.error); });

    Stream.feedManager.getUserFeed(userIds[4]).addActivity({
      'verb': 'bookmark',
      'actor': 'users:' + userIds[4],
      'object': 'summer-shaking-beef',
    })
      .catch(function(reason) { console.error('failed with reason', reason.error); });
  }
});

