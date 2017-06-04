/**
 * Created by noa on 5/23/17.
 */

var _ = require('lodash');
var cron = require('node-cron');

exports.hackishIsDebug = false;
exports.alertOffsetMilliseconds = 60 * 60 * 1000; // I.e. 1 hour.

var tasks = { };
var timeouts = { };

function __timeoutFactory(mongoose, userid, medicine_id) {
    var checkTimeframeStart = new Date();
    var checkTimeframeEnd = new Date(checkTimeframeStart);
    checkTimeframeEnd.setMinutes(checkTimeframeStart.getHours() + exports.alertOffsetMilliseconds);

    function checkIfNeedToAlertCaretaker() {
        mongoose.models.TakenMedicine.find({
                userid: userid,
                medicine_id: medicine_id,
                when: {$gte: checkTimeframeStart, $lte: checkTimeframeEnd}
            }, function (err, takenMedicineEntities) {
                if (_.isEmpty(takenMedicineEntities)) {
                    // TODO: check if alert already issued.
                    console.log('DEBUG EEEEEEEEEEK!', userid, medicine_id);
                }
            });
    }

    function createTimeout() {
        timeouts[userid].push(setTimeout(
            checkIfNeedToAlertCaretaker, exports.alertOffsetMilliseconds));
    }
    return createTimeout;
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
