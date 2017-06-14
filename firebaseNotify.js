var logger = require('./logger');
var _ = require('lodash');

var FCM = require('fcm-node');
var SERVER_KEY = 'AAAAC_-M5RQ:APA91bFGcMxQyiFfy0BTPAPk-hLUU1IptF9Vy_NvFXcrebF2f0CC876IHEU0O6cpxjgnKe8ooz2SZIRCIsFmsAyTZHtTyfbfRQ2aljZaSdVRtYJHy3lzBGijVqkr5SmW1HXxV3EMnVe3'; //put your server key here
var fcm = new FCM(SERVER_KEY);

exports.hackishIsDebug = false;

function __saveSentNotification(mongoose, patientUserId, recipientUserId, message) {
    (new mongoose.models.SentNotification({
        patient_userid: patientUserId,
        recipient_userid: recipientUserId,
        message: message
    }).save(function (err) {
        if (err) {
            logger('ERROR: failed to save notification sent to ' + userid + ': ' + JSON.stringify(message));
        }
    }));
}

function firebaseNotify(mongoose, patientUserId, recipients, payload) {
    _.forEach(recipients, function (recipient) {
        _.forEach(recipient.push_tokens, function (pushToken) {
            var message = { to: pushToken, collapse_key: 'do_not_collapse', data: payload };
            if (exports.hackishIsDebug) {
                logger('Mocking push to ' + pushToken + ' with payload ' + JSON.stringify(payload));
                __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
            } else {
                fcm.send(message, function (err, response) {
                    if (err) {
                        throw 'ERROR: failed to send notification: ' + JSON.stringify(message) + ' ; error is ' + JSON.stringify(err);
                    } else {
                        logger("Successfully sent notification " + JSON.stringify(message) + "; got response " + response);
                        __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
                    }
                });
            }
        })
    });
}

exports.firebaseNotify = firebaseNotify;