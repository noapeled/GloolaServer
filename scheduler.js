/**
 * Created by noa on 5/23/17.
 */

var FCM = require('fcm-node');
var SERVER_KEY = 'AAAAC_-M5RQ:APA91bFGcMxQyiFfy0BTPAPk-hLUU1IptF9Vy_NvFXcrebF2f0CC876IHEU0O6cpxjgnKe8ooz2SZIRCIsFmsAyTZHtTyfbfRQ2aljZaSdVRtYJHy3lzBGijVqkr5SmW1HXxV3EMnVe3'; //put your server key here
var fcm = new FCM(SERVER_KEY);

var _ = require('lodash');
var cron = require('node-cron');

exports.hackishIsDebug = false;
exports.alertOffsetMilliseconds = 60 * 60 * 1000; // I.e. 1 hour.

var tasks = { };
var timeouts = { };

function __firebaseNotify(pushTokens, payload) {
    _.forEach(pushTokens, function (pushToken) {
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: pushToken,
            collapse_key: 'do_not_collapse',
            data: payload
        };
        fcm.send(message, function (err, response) {
            if (err) {
                throw 'ERROR: failed to send notification: ' + JSON.stringify(message) + ' ; error is '  + JSON.stringify(err);
            } else {
                console.log("Successfully sent notification", message, "got response", response);
            }
        });
    });
}

function __timeoutFactory(mongoose, userid, medicine_id) {
    var checkTimeframeStart = new Date();

    function checkIfMedicineTakenSinceTimeframeStart(callbackInCaseMedicineNotTaken) {
        mongoose.models.TakenMedicine.find({
            userid: userid,
            medicine_id: medicine_id,
            when: { $gte: checkTimeframeStart }
        }, function (err, takenMedicineEntities) {
            if (_.isEmpty(takenMedicineEntities)) {
                // TODO: check if alert already issued.
                console.log('DEBUG EEEEEEEEEEK!', userid, medicine_id);
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
                        type: 'medicine_not_taken',
                        severity: 'nag',
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
            // TODO: notify caretakers.
        })
    }

    function createTimeouts() {
        timeouts[userid].push(setTimeout(
            nagPatientIfNeeded, exports.alertOffsetMilliseconds / 2));
        timeouts[userid].push(setTimeout(
            alertCaretakersIfNeeded, exports.alertOffsetMilliseconds));
    }
    return createTimeouts;
}

function updateTasksForUser(mongoose, userEntity) {
    var userid = userEntity.userid;
    _.map(tasks[userid], function (task) {
        task.destroy();
    });
    _.map(timeouts[userid], function (timeoutObject) {
        clearTimeout(timeoutObject);
    });
    timeouts[userid] = [];
    tasks[userEntity.userid] = _.map(userEntity.medical_info.medication, function (med) {
        var frequency = med.frequency.toObject()[0];
        var second = exports.hackishIsDebug ? '* ' : '';
        return cron.schedule(second + [
            frequency.minute,
            frequency.hour,
            frequency.day_of_month,
            frequency.month_of_year,
            frequency.day_of_week].join(' '),
            __timeoutFactory(mongoose, userid, med.medicine_id),
            true)
    });
}

function createInitialTasks(mongoose) {
    mongoose.models.User.find({ }, function(err, userEntities) {
        if (err) {
            throw 'ERROR: failed to obtain users for scheduling alerts';
        } else {
            _.map(userEntities, _.partial(updateTasksForUser, mongoose));
        }
    });
}

exports.updateTasksForUser = updateTasksForUser;
exports.createInitialTasks = createInitialTasks;

// firebaseNotify(
//     ['fIKWkUBNKM0:APA91bFmK8wrswXHUSX7OW5p9nxUc8MuJFhYPxxhrvspaqLJSIZCpEBrxLR-SokGxzOUag6puenfShLVnYQrOrUx2LhVQ-_kHJl8JhO0UEgJep82krLvUwpu1b04vzPLlPHxF82eFtJ6'],
//     { demo: "payload" }
// );
