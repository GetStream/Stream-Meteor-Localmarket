Follows = new Mongo.Collection('follows');

Follows.allow({
  insert: function(userId, doc) {
    return false;
    return doc.user === userId;
  },
  remove: function(userId, doc) {
  	return doc.user === userId;
  },
});

Meteor.methods({
	follow: function(doc) {
		check(doc, {
			user: String,
			target: String
		});

		return Follows.insert(doc);
	},

	unfollow: function(doc) {
		check(doc, {
			user: String,
			target: String
		});

		Follows.remove(doc);
	}
});

Stream.registerActivity(Follows, {
	activityVerb: 'follow',
	activityActorProp: 'user',

	activityExtraData: function() {
		return {
			target: 'users:' + this.target
		};
	},

	activityForeignId: function() {
		return this.user + ':' + this.target;
	},
});

if(Meteor.isServer) {
	Follows.after.insert(function(userId, doc) {
		Stream.feedManager.followUser(doc.user, doc.target);
	});

	Follows.after.remove(function(userId, doc) {
		Stream.feedManager.unfollowUser(doc.user, doc.target);
	});
}