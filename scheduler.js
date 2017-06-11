/**
 * Created by noa on 5/23/17.
 */

var firebaseNotify = require('./firebaseNotify').firebaseNotify;
var addToFeed = require('./models/addToFeed').addToFeed;
var getCronExpression = require('./models/scheduled_medicine').getCronExpression;

var _ = require('lodash');
var cron = require('node-cron');

exports.hackishIsDebug = false;
exports.alertOffsetMilliseconds = 60 * 60 * 1000; // I.e. 1 hour.

var cronTasks = { };
var timedNotifications = { };

function __pushReminderToPatient(mongoose, userid, medicine_id, checkTimeframeStart) {
    mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
        if (err) {
            throw 'ERROR: failed to retrieve patient ' + userid + ' for reminding to take medicine ' + medicine_id;
        } else {
            firebaseNotify(mongoose, userid, [{ recipientUserid: userid, push_tokens: userEntity.push_tokens }], {
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

function __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, scheduledMedicineId, checkTimeframeStart, callbackInCaseMedicineNotTaken) {
    mongoose.models.TakenMedicine.find({
        userid: userid,
        scheduled_medicine_id: scheduledMedicineId,
        when: { $gte: checkTimeframeStart }
    }, function (err, takenMedicineEntities) {
        if (_.isEmpty(takenMedicineEntities)) {
            callbackInCaseMedicineNotTaken();
        }
    });
}

function __nagPatientIfNeeded(mongoose, userid, scheduledMedicineId, checkTimeframeStart) {
    __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, scheduledMedicineId, checkTimeframeStart, function () {
        mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
            if (err) {
                throw 'ERROR: failed to retrieve patient ' + userid +
                ' for nagging about scheduled medicine ' + scheduledMedicineId + 'not taken!';
            } else {
                firebaseNotify(mongoose, userid, [{ recipientUserid: userid, push_tokens: userEntity.push_tokens }], {
                    type: 'nag_medicine_not_taken',
                    userid: userid,
                    scheduled_medicine_id: scheduledMedicineId,
                    timeframe: {
                        start: checkTimeframeStart,
                        elapsed_milliseconds: (new Date() - checkTimeframeStart)
                    }
                });
            }
        });
    });
}

function __alertCaretakersIfNeeded(mongoose, userid, scheduledMedicineId, checkTimeframeStart) {
    __checkIfMedicineTakenSinceTimeframeStart(mongoose, userid, scheduledMedicineId, checkTimeframeStart, function () {
        mongoose.models.User.find({ patients: { $all: [userid] } }, function (err, caretakers) {
            if (err) {
                throw 'ERROR: failed to retrieve caretakers of patient ' + userid +
                ' for alerting about medicine ' + medicine_id + 'not taken!';
            } else {
                var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                    return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens };
                });
                var elapsed_milliseconds = new Date() - checkTimeframeStart;
                firebaseNotify(mongoose, userid, caretakersPushTokens, {
                    type: 'alert_medicine_not_taken',
                    userid: userid,
                    scheduled_medicine_id: scheduledMedicineId,
                    timeframe: {
                        start: checkTimeframeStart,
                        elapsed_milliseconds: elapsed_milliseconds
                    }
                });
                addToFeed(mongoose, userid, {
                    userid: userid,
                    when: (new Date()).toISOString(),
                    scheduled_medicine_id: scheduledMedicineId,
                    event: { type: 'medicine_not_taken', contents: { timeframe: {
                        start: checkTimeframeStart,
                        elapsed_milliseconds: elapsed_milliseconds
                    } }}
                })
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
            _.partial(__nagPatientIfNeeded, mongoose, userid, scheduledMedicineId, checkTimeframeStart),
            exports.alertOffsetMilliseconds / 2));
        timedNotifications[scheduledMedicineId].push(setTimeout(
            _.partial(__alertCaretakersIfNeeded, mongoose, userid, scheduledMedicineId, checkTimeframeStart),
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

exports.updateTimersForScheduledMedicine = updateCronTaskForScheduledMedicine;
exports.createInitialTasks = createInitialTasks;

// firebaseNotify(
//     ['fIKWkUBNKM0:APA91bFmK8wrswXHUSX7OW5p9nxUc8MuJFhYPxxhrvspaqLJSIZCpEBrxLR-SokGxzOUag6puenfShLVnYQrOrUx2LhVQ-_kHJl8JhO0UEgJep82krLvUwpu1b04vzPLlPHxF82eFtJ6'],
//     { demo: "payload" }
// );
