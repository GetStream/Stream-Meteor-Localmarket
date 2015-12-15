Accounts.onCreateUser(function(options, user) {
  if (options.profile)
    user.profile = options.profile;

  // If this is the first user going into the database, make them an admin
  if (Meteor.users.find().count() === 0)
    user.admin = true;


	// New users news feed follow his own user feed
	Stream.feedManager.followUser(user._id, user._id);

  return user;
});