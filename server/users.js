Accounts.onCreateUser(function(options, user) {
  if (options.profile)
    user.profile = options.profile;

  // If this is the first user going into the database, make them an admin
  if (Meteor.users.find().count() === 5)
    user.admin = true;

  Follows.insert({
  	user: user._id,
  	target: user._id
  });

  return user;
});