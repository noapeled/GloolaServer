/**
 * Created by noa on 5/23/17.
 */

var logger = require('./logger');
var firebaseNotify = require('./firebaseNotify').firebaseNotify;
var addEventAboutScheduledMedicine = require('./models/addToFeed').addEventAboutScheduledMedicine;
var getCronExpression = require('./models/scheduled_medicine').getCronExpression;

var _ = require('lodash');
var cron = require('node-cron');

exports.hackishIsDebug = false;

var cronTasks = { };
var timedNotifications = { };

function __pushReminderToPatient(mongoose, userid, scheduledMedicineId, checkTimeframeStart) {
    mongoose.models.User.findOne({ userid: userid }, function (err, userEntity) {
        if (err) {
            logger.error('Failed to retrieve patient ' + userid + ' for reminding to take medicine ' + medicine_id);
        } else {
            firebaseNotify(mongoose, userid, [{ recipientUserid: userid, push_tokens: userEntity.push_tokens }], {
                type: 'reminder_take_medicine',
                userid: userid,
                scheduled_medicine_id: scheduledMedicineId,
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
                logger.error('Failed to retrieve patient ' + userid +
                    ' for nagging about scheduled medicine ' + scheduledMedicineId + 'not taken!');
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
        mongoose.models.User.find({patients: {$all: [userid]}}, function (err, caretakers) {
            if (err) {
                logger.error('Failed to retrieve caretakers of patient ' + userid +
                    ' for alerting about medicine ' + medicine_id + 'not taken!');
            } else {
                var caretakersPushTokens = _.map(caretakers, function (careTakerEntity) {
                    return {recipientUserid: careTakerEntity.userid, push_tokens: careTakerEntity.push_tokens};
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
                addEventAboutScheduledMedicine(
                    mongoose,
                    scheduledMedicineId,
                    (new Date()).toISOString(),
                    'scheduled_medicine_not_taken',
                    {
                        timeframe: {
                            start: checkTimeframeStart,
                            elapsed_milliseconds: elapsed_milliseconds
                        }
                    });
            }
        });
    });
}

function __minutes_to_milliseconds(m) {
    return m * 60 * 1000;
}

function __remindPatientAndSetTimersForTakenMedicine(mongoose, scheduledMedicineEntity) {
    logger.info('Checking whether to remind patient ' + scheduledMedicineEntity.userid +
        ' about medicine ' + scheduledMedicineEntity.medicine_id);
    var checkTimeframeStart = new Date();
    var isAfterStart = (!scheduledMedicineEntity.start_time) || (scheduledMedicineEntity.start_time <= checkTimeframeStart);
    var isBeforeEnd = (!scheduledMedicineEntity.end_time) || (scheduledMedicineEntity.end_time >= checkTimeframeStart);
    if (isAfterStart && isBeforeEnd) {
        __pushReminderToPatient(
            mongoose,
            scheduledMedicineEntity.userid,
            scheduledMedicineEntity.scheduled_medicine_id,
            checkTimeframeStart);

        var nagMilliseconds = __minutes_to_milliseconds(scheduledMedicineEntity.nag_offset_minutes);
        timedNotifications[scheduledMedicineEntity.scheduled_medicine_id].push(setTimeout(
            _.partial(__nagPatientIfNeeded,
                mongoose,
                scheduledMedicineEntity.userid,
                scheduledMedicineEntity.scheduled_medicine_id,
                checkTimeframeStart),
            nagMilliseconds));
        logger.info('Set nag timer to ' + nagMilliseconds + ' msec from now.');

        var alertMilliseconds = __minutes_to_milliseconds(scheduledMedicineEntity.alert_offset_minutes);
        timedNotifications[scheduledMedicineEntity.scheduled_medicine_id].push(setTimeout(
            _.partial(__alertCaretakersIfNeeded,
                mongoose,
                scheduledMedicineEntity.userid,
                scheduledMedicineEntity.scheduled_medicine_id,
                checkTimeframeStart),
                alertMilliseconds
            ));
        logger.info('Set alert timer to ' + alertMilliseconds + ' msec from now.');
    } else {
        logger.info('Not within time interval for reminding patient ' + scheduledMedicineEntity.userid +
            ' about medicine ' + scheduledMedicineEntity.medicine_id);
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
        var frequencyCronFormat = second + getCronExpression(scheduledMedicineEntity.frequency);
        cronTasks[scheduledMedicineId] = cron.schedule(
            frequencyCronFormat,
            _.partial(__remindPatientAndSetTimersForTakenMedicine, mongoose, scheduledMedicineEntity),
            true);
        logger.info('Scheduled reminders with cron frequency [' + frequencyCronFormat + '] for ScheduledMedicine ' +
            JSON.stringify(scheduledMedicineEntity.toObject()));
    }
}

function createInitialTasks(mongoose) {
    mongoose.models.ScheduledMedicine.find({ }, function(err, schedulesMedicineEntities) {
        if (err) {
            logger.error('Failed to obtain scheduled medicine for initializing cron tasks');
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
