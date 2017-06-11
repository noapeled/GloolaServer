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

function __firebaseNotify(pushTokens, payload) {
    if (exports.hackishIsDebug) {
        _.forEach(pushTokens, function (pushToken) {
            console.log('Mocking push to ' + pushToken + ' with payload ' + JSON.stringify(payload));
        });
    } else {
        _.forEach(pushTokens, function (pushToken) {
            var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
                to: pushToken,
                collapse_key: 'do_not_collapse',
                data: payload
            };
            fcm.send(message, function (err, response) {
                if (err) {
                    throw 'ERROR: failed to send notification: ' + JSON.stringify(message) + ' ; error is ' + JSON.stringify(err);
                } else {
                    console.log("Successfully sent notification", message, "got response", response);
                }
            });
        });
    }
}

function __remindPatientAndSetTimersForTakenMedicine(mongoose, userid, medicine_id) {
    var checkTimeframeStart = new Date();

    mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
        if (err) {
            throw 'ERROR: failed to retrieve patient ' + userid + ' for reminding to take medicine ' + medicine_id;
        } else {
            __firebaseNotify(userEntity.push_tokens, {
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

    function checkIfMedicineTakenSinceTimeframeStart(callbackInCaseMedicineNotTaken) {
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

    function nagPatientIfNeeded() {
        checkIfMedicineTakenSinceTimeframeStart(function () {
            mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
                if (err) {
                    throw 'ERROR: failed to retrieve patient ' + userid +
                        ' for nagging about medicine ' + medicine_id + 'not taken!';
                } else {
                    __firebaseNotify(userEntity.push_tokens, {
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

    function alertCaretakersIfNeeded() {
        checkIfMedicineTakenSinceTimeframeStart(function () {
            mongoose.models.User.find({ patients: { $all: [userid] } }, function (err, caretakers) {
                if (err) {
                    throw 'ERROR: failed to retrieve caretakers of patient ' + userid +
                        ' for alerting about medicine ' + medicine_id + 'not taken!';
                } else {
                    var caretakersPushTokens = _(caretakers).flatMap('push_tokens').uniq().value();
                    __firebaseNotify(caretakersPushTokens, {
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

    timedNotifications[userid].push(setTimeout(nagPatientIfNeeded, exports.alertOffsetMilliseconds / 2));
    timedNotifications[userid].push(setTimeout(alertCaretakersIfNeeded, exports.alertOffsetMilliseconds));
}

function updateCronTaskForScheduledMedicine(mongoose, scheduledMedicineEntity) {
    cronTasks[scheduledMedicineEntity.scheduled_medicine_id] ?
        cronTasks[scheduledMedicineEntity.scheduled_medicine_id].destroy() : null;
    var second = exports.hackishIsDebug ? '*/5 ' : '';
    cronTasks[scheduledMedicineEntity.scheduled_medicine_id] = cron.schedule(
        second + getCronExpression(scheduledMedicineEntity.frequency),
        _.partial(__remindPatientAndSetTimersForTakenMedicine,
            mongoose, scheduledMedicineEntity.userid, scheduledMedicineEntity.medicine_id),
        true);
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

exports.updateTimersForScheduledMedicine = updateCronTaskForScheduledMedicine;
exports.createInitialTasks = createInitialTasks;

// firebaseNotify(
//     ['fIKWkUBNKM0:APA91bFmK8wrswXHUSX7OW5p9nxUc8MuJFhYPxxhrvspaqLJSIZCpEBrxLR-SokGxzOUag6puenfShLVnYQrOrUx2LhVQ-_kHJl8JhO0UEgJep82krLvUwpu1b04vzPLlPHxF82eFtJ6'],
//     { demo: "payload" }
// );
