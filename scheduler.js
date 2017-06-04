/**
 * Created by noa on 5/23/17.
 */

require('./db');

var mongoose = require('mongoose');
var cron = require('node-cron');

var tasks = { };


function createInitialTasks() {
    mongoose.models.User.find({ }, 'userid', function(err, docs) { console.log(docs); });
}

function addTaskForUser() {

}

function removeTaskForUser() {

}

function updateTasksForUser(userId) {
    _.map(tasks[userId], function (task) { task.destroy(); });
    mongoose.models.User.findOne({ userId: userId }, function(err, user) {
        if (err) {
            // TODO: retry?
        } else {
            function checkIfNeedToAlertCaretaker() {
                // UserId is known here.
            }
            tasks[userId] = _.map(user.medical_info.medication, function (med) {
                cron.schedule([
                    med.frequency.minute,
                    med.frequence.hour,
                    med.frequency.day_of_month,
                    med.frequency.month_of_year,
                    med.frequency.day_of_week].join(' '), checkIfNeedToAlertCaretaker, true)
            });
        }
    });
}

createInitialTasks();
