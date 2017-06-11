var logger = require('./logger');
var _ = require('lodash');
var firebaseNotify = require('../firebaseNotify').firebaseNotify;

function __notifyCaretakersAboutNewFeedEvent(mongoose, patientUserId, feedEventBody) {
    mongoose.models.User.find({ patients: { $all: [patientUserId] } }, function (err, caretakers) {
        if (err) {
            throw 'ERROR: failed to retrieve caretakers of patient ' + userid + ' for notifying about new feed event ';
        } else {
            var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens };
            });
            firebaseNotify(mongoose, patientUserId, caretakersPushTokens, {
                type: 'new_feed_event',
                userid: patientUserId,
                feed_event: feedEventBody
            });
        }
    });
}

function addToFeed(mongoose, patientUserid, feedEventBody) {
    (new mongoose.models.FeedEvent(feedEventBody)).save(function(err) {
        if (err) {
            logger('Error: failed to add event to feed: ' + JSON.stringify(feedEventBody) + ' -- error is ' + JSON.stringify(err));
        } else {
            __notifyCaretakersAboutNewFeedEvent(mongoose, patientUserid, feedEventBody);
        }
    })
}

exports.addToFeed = addToFeed;
