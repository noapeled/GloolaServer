/**
 * Created by noa on 5/23/17.
 */

var cron = require('node-cron');

var alertOffsetMinutes = 60;
var factorFromMinutesToMilliseconds = 60 * 1000;
var tasks = { };
var timeouts = { };

function __timeoutFactory(mongoose, userid, medicine_id) {
    var checkTimeframeStart = new Date();
    var checkTimeframeEnd = new Date(checkTimeframeStart);
    checkTimeframeEnd.setMinutes(checkTimeframeStart.getHours() + alertOffsetMinutes);

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
            checkIfNeedToAlertCaretaker, alertOffsetMinutes * factorFromMinutesToMilliseconds));
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
        return cron.schedule([
            med.frequency.minute,
            med.frequency.hour,
            med.frequency.day_of_month,
            med.frequency.month_of_year,
            med.frequency.day_of_week].join(' '),
            __timeoutFactory(userid, med.medicine_id),
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

exports.updateTaskForUser = updateTasksForUser;
exports.createInitialTasks = createInitialTasks;
