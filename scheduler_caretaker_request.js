var logger = require('./logger');
var firebaseNotify = require('./firebaseNotify').firebaseNotify;
var _ = require('lodash');

exports.hackishIsDebug = false;
exports.NAG_INTERVAL_MINUTES = 60;

var timedNotifications = { };

function __minutes_to_milliseconds(m) {
    return m * 60 * 1000;
}

function notifyPatientAboutPendingCaretakerRequest(mongoose, caretakerRequestEntity) {
    var patientUserid = caretakerRequestEntity.patient;
    var caretakerUserid = caretakerRequestEntity.caretaker;
    mongoose.models.User.findOne({ userid: patientUserid }, function(err, patientUserEntity) {
        if (err) {
            logger('ERROR: failed to retrieve patient ' + patientUserid + ' for nagging about caretaker request ' +
                caretakerRequestEntity.request_id);
        } else {
            mongoose.models.User.findOne({ userid: caretakerUserid }, function(err, caretakerUserEntity) {
                if (err) {
                    logger('Error: failed to retrieve caretaker ' + caretakerUserid + ' to nag patient ' +
                        patientUserid + ' about pending caretaker request');
                } else {
                    firebaseNotify(
                        mongoose,
                        patientUserid,
                        [{ recipientUserid: patientUserid, push_tokens: patientUserEntity.push_tokens }],
                        {
                            type: 'caretaker_request',
                            request: caretakerRequestEntity.toObject(),
                            caretaker: _.pick(caretakerUserEntity, ['userid', 'name', 'email'])
                        });
                }
            });
        }
    });
}

function nagPatientAboutPendingCaretakerRequest(mongoose, pendingCaretakerRequestEntity) {
    notifyPatientAboutPendingCaretakerRequest(mongoose, caretakerRequestEntity);
    if (timedNotifications[pendingCaretakerRequestEntity.request_id]) {
        clearTimeout(timedNotifications[pendingCaretakerRequestEntity.request_id]);
    }
    timedNotifications[requestId] = setTimeout(
        nagPatientAboutPendingCaretakerRequest,
        __minutes_to_milliseconds(exports.NAG_INTERVAL_MINUTES)
    );
}

function createInitialTasks(mongoose) {
    mongoose.models.Caretaker.find({ status: 'pending', hidden: 'false' }, function(err, pendingCaretakerEntities) {
        if (err) {
            throw 'ERROR: failed to obtain all pending caretaker requests for initializing cron tasks';
        } else {
            _.map(pendingCaretakerEntities, _.partial(nagPatientAboutPendingCaretakerRequest, mongoose));
        }
    });
}

exports.nagPatientAboutPendingCaretakerRequest = nagPatientAboutPendingCaretakerRequest;
exports.createInitialTasks = createInitialTasks;

