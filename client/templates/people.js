Template.people.events({
  'click .actions-follow': function(e) {
    if(e.target.checked) {
      Meteor.call('follow', {
        user: Meteor.userId(),
        target: this._id
      }, function(error, result) {
        if(error) {
          alert('follow failed with: ' + error);
        }
      });
    } else {
      Meteor.call('unfollow', {
        user: Meteor.userId(),
        target: this._id
      });
    }
  },

  'click #load-more-people': function(e) {
    e.preventDefault();

    var l = Session.get('people_limit');
    Session.set('people_limit', l + 5);
  }
});