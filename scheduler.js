/**
 * Created by noa on 5/23/17.
 */

require('./db');

var mongoose = require('mongoose');
var cron = require('node-cron');

var alertOffsetMinutes = 60;
var factorFromMinutesToMilliseconds = 60 * 1000;
var tasks = { };


function createInitialTasks() {
    mongoose.models.User.find({ }, 'userid', function(err, docs) { console.log(docs); });
}

function addTaskForUser() {

}

function removeTaskForUser() {

}

function timeoutFactory(userid, medicine_id) {
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
        // TODO: keep this object somewhere so that the timeout can be cancelled if the medicine is removed from the user's medical_info.
        var timeout = setTimeout(checkIfNeedToAlertCaretaker,
            alertOffsetMinutes * factorFromMinutesToMilliseconds);
    }
    return createTimeout;
}

function updateTasksForUser(userId) {
    _.map(tasks[userId], function (task) {
        task.destroy();
    });
    mongoose.models.User.findOne({ userId: userId }, function(err, user) {
        if (err) {
            // TODO: retry?
        } else {
            tasks[userId] = _.map(user.medical_info.medication, function (med) {
                cron.schedule([
                    med.frequency.minute,
                    med.frequency.hour,
                    med.frequency.day_of_month,
                    med.frequency.month_of_year,
                    med.frequency.day_of_week].join(' '), timeoutFactory(userId, med.medicine_id), true)
            });
        }
    });
}

createInitialTasks();
