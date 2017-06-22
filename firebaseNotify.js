var logger = require('./logger');
var _ = require('lodash');

var FCM = require('fcm-node');
var SERVER_KEY = 'AAAAf1sV3dk:APA91bHoY3lH3ppTODcg8y-ib7rQHKoDlCSFhK948k3S_rMMXUtszN0PwB35y6UVWMsJBSYC6fqAeiELFm-kvdovU-JtbAsszDDHEsE3fLR9r_9-s5yBxCo4HE4k5FvbtzaXKHcVoMk-';
var fcm = new FCM(SERVER_KEY);

exports.hackishIsDebug = false;

function __saveSentNotification(mongoose, patientUserId, recipientUserId, message) {
    (new mongoose.models.SentNotification({
        patient_userid: patientUserId,
        recipient_userid: recipientUserId,
        message: message
    }).save(function (err) {
        if (err) {
            logger.error('Failed to save notification sent to ' + userid + ': ' + JSON.stringify(message));
        }
    }));
}

function firebaseNotify(mongoose, patientUserId, recipients, payload) {
    _.forEach(recipients, function (recipient) {
        _.forEach(recipient.push_tokens, function (pushToken) {
            var message = { to: pushToken, collapse_key: 'do_not_collapse', data: payload };
            if (exports.hackishIsDebug) {
                logger.info('Mocking push to ' + pushToken + ' with payload ' + JSON.stringify(payload));
                __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
            } else {
                fcm.send(message, function (err, response) {
                    if (err) {
                        logger.error('Failed to send notification: ' + JSON.stringify(message) + ' ; error is ' + JSON.stringify(err));
                    } else {
                        logger.info("Successfully sent notification " + JSON.stringify(message) + "; got response " + response);
                        __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
                    }
                });
            }
        })
    });
}

exports.firebaseNotify = firebaseNotify;