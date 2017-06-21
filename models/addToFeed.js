var logger = require('../logger');
var _ = require('lodash');
var firebaseNotify = require('../firebaseNotify').firebaseNotify;

function getCaretakerUserEntities(mongoose, patientUserid, callbackOnSuccess, callbackOnFailure) {
    mongoose.models.Caretaker.find({ patient: patientUserid, status: 'accepted' }, function (err, caretakers) {
        if (err) {
            callbackOnFailure(err);
        } else {
            mongoose.models.User.find({ userid: { $in: _.map(caretakers, 'caretaker') } }, function(err, caretakerUsers) {
                if (err) {
                    callbackOnFailure(err);
                } else {
                    callbackOnSuccess(caretakerUsers);
                }
            });
        }
    });
}

function __notifyCaretakersAboutNewFeedEvent(mongoose, patientUserId, feedEventBody) {
    getCaretakerUserEntities(
        mongoose,
        patientUserId,
        function (caretakers) {
            var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens };
            });
            firebaseNotify(mongoose, patientUserId, caretakersPushTokens, {
                type: 'new_feed_event',
                userid: patientUserId,
                feed_event: feedEventBody
            });
        },
        function (err) {
            logger.error('Failed to retrieve caretakers of patient ' + patientUserId + ' for notifying about new feed event ');
        });
}

function addEventAboutScheduledMedicine(mongoose, scheduledMedicineId, when, eventType, eventContents) {
    mongoose.models.ScheduledMedicine.findOne({ scheduled_medicine_id: scheduledMedicineId }, function (err, scheduledMedicineEntity) {
        if (err || !scheduledMedicineEntity) {
            logger.error('Failed to retrieve scheduled medicine ' + scheduledMedicineId + ' for feed event: '
                + JSON.stringify(err));
        } else {
            var patientUserid = scheduledMedicineEntity.userid;
            mongoose.models.Medicine.findOne({ medicine_id: scheduledMedicineEntity.medicine_id }, function (err, medicineEntity) {
                if (err || !medicineEntity) {
                    logger.error('Failed to retrieve medicine ' + scheduledMedicineEntity.medicine_id + ' for feed event: '
                        + JSON.stringify(err));
                } else {
                    var feedEventBody = {
                        userid: patientUserid,
                        scheduled_medicine_id: scheduledMedicineId,
                        medicine_names: medicineEntity.medicine_names,
                        when: when,
                        event: { type: eventType, contents: eventContents }
                    };
                    (new mongoose.models.FeedEvent(feedEventBody)).save(function(err) {
                        if (err) {
                            logger.info('Error: failed to add event to feed: ' + JSON.stringify(feedEventBody) + ' -- error is ' + JSON.stringify(err));
                        } else {
                            __notifyCaretakersAboutNewFeedEvent(mongoose, patientUserid, feedEventBody);
                        }
                    });
                }
            })
        }
    });
}

exports.addEventAboutScheduledMedicine = addEventAboutScheduledMedicine;
