/**
 * Created by noa on 5/23/17.
 */

var getCronExpression = require('./models/scheduled_medicine').getCronExpression;
var FCM = require('fcm-node');
var SERVER_KEY = 'AAAAC_-M5RQ:APA91bFGcMxQyiFfy0BTPAPk-hLUU1IptF9Vy_NvFXcrebF2f0CC876IHEU0O6cpxjgnKe8ooz2SZIRCIsFmsAyTZHtTyfbfRQ2aljZaSdVRtYJHy3lzBGijVqkr5SmW1HXxV3EMnVe3'; //put your server key here
var fcm = new FCM(SERVER_KEY);

var _ = require('lodash');
var cron = require('node-cron');

exports.hackishIsDebug = false;
exports.alertOffsetMilliseconds = 60 * 60 * 1000; // I.e. 1 hour.

var cronTasks = { };
var timedNotifications = { };

function notifyCaretakersAboutNewFeedEvent(mongoose, patientUserId, feedEventBody) {
    mongoose.models.User.find({ patients: { $all: [patientUserId] } }, function (err, caretakers) {
        if (err) {
            throw 'ERROR: failed to retrieve caretakers of patient ' + userid + ' for notifying about new feed event ';
        } else {
            var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens };
            });
            __firebaseNotify(mongoose, patientUserId, caretakersPushTokens, {
                type: 'new_feed_event',
                userid: patientUserId,
                feed_event: feedEventBody
            });
        }
    });
}

function __saveSentNotification(mongoose, patientUserId, recipientUserId, message) {
    (new mongoose.models.SentNotification({
        patient_userid: patientUserId,
        recipient_userid: recipientUserId,
        message: message
    }).save(function (err) {
        if (err) {
            console.log('ERROR: failed to save notification sent to ' + userid + ': ' + JSON.stringify(message));
        }
    }));
}

function __firebaseNotify(mongoose, patientUserId, recipients, payload) {
    _.forEach(recipients, function (recipient) {
        _.forEach(recipient.push_tokens, function (pushToken) {
            var message = { to: pushToken, collapse_key: 'do_not_collapse', data: payload };
            if (exports.hackishIsDebug) {
                console.log('Mocking push to ' + pushToken + ' with payload ' + JSON.stringify(payload));
                __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
            } else {
                fcm.send(message, function (err, response) {
                    if (err) {
                        throw 'ERROR: failed to send notification: ' + JSON.stringify(message) + ' ; error is ' + JSON.stringify(err);
                    } else {
                        console.log("Successfully sent notification", message, "got response", response);
                        __saveSentNotification(mongoose, patientUserId, recipient.recipientUserid, message);
                    }
                });
            }
        })
    });
}

function __pushReminderToPatient(mongoose, userid, medicine_id, checkTimeframeStart) {
    mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
        if (err) {
            throw 'ERROR: failed to retrieve patient ' + userid + ' for reminding to take medicine ' + medicine_id;
        } else {
            __firebaseNotify(mongoose, userid, [{ recipientUserid: userid, push_tokens: userEntity.push_tokens }], {
                type: 'reminder_take_medicine',
                userid: userid,
                medicine_id: medicine_id,
                timeframe: {
                    start: checkTimeframeStart,
                    elapsed_milliseconds: (new Date() - checkTimeframeStart)
                }
            });
        }
    });
}

function __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, medicine_id, checkTimeframeStart, callbackInCaseMedicineNotTaken) {
    mongoose.models.TakenMedicine.find({
        userid: userid,
        medicine_id: medicine_id,
        when: { $gte: checkTimeframeStart }
    }, function (err, takenMedicineEntities) {
        if (_.isEmpty(takenMedicineEntities)) {
            // TODO: check if alert already issued.
            callbackInCaseMedicineNotTaken();
        }
    });
}

function __nagPatientIfNeeded(mongoose, userid, medicine_id, checkTimeframeStart) {
    __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, medicine_id, checkTimeframeStart, function () {
        mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
            if (err) {
                throw 'ERROR: failed to retrieve patient ' + userid +
                ' for nagging about medicine ' + medicine_id + 'not taken!';
            } else {
                __firebaseNotify(mongoose, userid, [{ recipientUserid: userid, push_tokens: userEntity.push_tokens }], {
                    type: 'nag_medicine_not_taken',
                    userid: userid,
                    medicine_id: medicine_id,
                    timeframe: {
                        start: checkTimeframeStart,
                        elapsed_milliseconds: (new Date() - checkTimeframeStart)
                    }
                });
            }
        });
    });
}

function __alertCaretakersIfNeeded(mongoose, userid, medicine_id, checkTimeframeStart) {
    __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, medicine_id, checkTimeframeStart, function () {
        mongoose.models.User.find({ patients: { $all: [userid] } }, function (err, caretakers) {
            if (err) {
                throw 'ERROR: failed to retrieve caretakers of patient ' + userid +
                ' for alerting about medicine ' + medicine_id + 'not taken!';
            } else {
                var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                    return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens };
                });
                __firebaseNotify(mongoose, userid, caretakersPushTokens, {
                    type: 'alert_medicine_not_taken',
                    userid: userid,
                    medicine_id: medicine_id,
                    timeframe: {
                        start: checkTimeframeStart,
                        elapsed_milliseconds: (new Date() - checkTimeframeStart)
                    }
                });
            }
        });
    })
}

function __remindPatientAndSetTimersForTakenMedicine(mongoose, userid, medicine_id,
                                                     scheduledMedicineId, scheduledStartTime, scheduledEndTime) {
    var checkTimeframeStart = new Date();
    var isAfterStart = (!scheduledStartTime) || (scheduledStartTime <= checkTimeframeStart);
    var isBeforeEnd = (!scheduledEndTime) || (scheduledEndTime >= checkTimeframeStart);
    if (isAfterStart && isBeforeEnd) {
        __pushReminderToPatient(mongoose, userid, medicine_id, checkTimeframeStart);
        timedNotifications[scheduledMedicineId].push(setTimeout(
            _.partial(__nagPatientIfNeeded, mongoose, userid, medicine_id, checkTimeframeStart),
            exports.alertOffsetMilliseconds / 2));
        timedNotifications[scheduledMedicineId].push(setTimeout(
            _.partial(__alertCaretakersIfNeeded, mongoose, userid, medicine_id, checkTimeframeStart),
            exports.alertOffsetMilliseconds));
    }
}

function updateCronTaskForScheduledMedicine(mongoose, scheduledMedicineEntity) {
    var scheduledMedicineId = scheduledMedicineEntity.scheduled_medicine_id;
    if (_.isUndefined(timedNotifications[scheduledMedicineId])) {
        timedNotifications[scheduledMedicineId] = [];
    }
    _.forEach(timedNotifications[scheduledMedicineId], function (timeoutObject) {
        clearTimeout(timeoutObject);
    });
    if (cronTasks[scheduledMedicineId]) {
        cronTasks[scheduledMedicineId].destroy();
    }
    if (scheduledMedicineEntity.hidden === false) {
        var second = exports.hackishIsDebug ? '*/2 ' : '';
        cronTasks[scheduledMedicineId] = cron.schedule(
            second + getCronExpression(scheduledMedicineEntity.frequency),
            _.partial(__remindPatientAndSetTimersForTakenMedicine,
                mongoose, scheduledMedicineEntity.userid, scheduledMedicineEntity.medicine_id, scheduledMedicineId,
                scheduledMedicineEntity.start_time, scheduledMedicineEntity.end_time),
            true);
    }
}

function createInitialTasks(mongoose) {
    mongoose.models.ScheduledMedicine.find({ }, function(err, schedulesMedicineEntities) {
        if (err) {
            throw 'ERROR: failed to obtain scheduled medicine for initializing cron tasks';
        } else {
            _.map(schedulesMedicineEntities, _.partial(updateCronTaskForScheduledMedicine, mongoose));
        }
    });
}

exports.notifyCaretakersAboutNewFeedEvent = notifyCaretakersAboutNewFeedEvent;
exports.updateTimersForScheduledMedicine = updateCronTaskForScheduledMedicine;
exports.createInitialTasks = createInitialTasks;

// firebaseNotify(
//     ['fIKWkUBNKM0:APA91bFmK8wrswXHUSX7OW5p9nxUc8MuJFhYPxxhrvspaqLJSIZCpEBrxLR-SokGxzOUag6puenfShLVnYQrOrUx2LhVQ-_kHJl8JhO0UEgJep82krLvUwpu1b04vzPLlPHxF82eFtJ6'],
//     { demo: "payload" }
// );
