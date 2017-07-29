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
        if (err || !patientUserEntity) {
            logger.error('Failed to retrieve patient ' + patientUserid + ' for nagging about caretaker request ' +
                caretakerRequestEntity.request_id);
        } else {
            mongoose.models.User.findOne({ userid: caretakerUserid }, function(err, caretakerUserEntity) {
                if (err || !caretakerUserEntity) {
                    logger.error('Failed to retrieve caretaker ' + caretakerUserid + ' to nag patient ' +
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

function nagPatientAboutPendingCaretakerRequest(mongoose, requestId) {
    if (timedNotifications[requestId]) {
        clearTimeout(timedNotifications[requestId]);
    }
    mongoose.models.Caretaker.findOne({ request_id: requestId }, function (err, caretakerRequestEntity) {
        if (err || !caretakerRequestEntity) {
            logger.error('Failed to retrieve caretaker request ' + requestId + ', will retry');
        } else {
            if ((caretakerRequestEntity.hidden) || (caretakerRequestEntity.status !== 'pending')) {
                logger.info('Request ' + requestId + ' is not pending anymore, nags stopped.');
            } else {
                if (caretakerRequestEntity.nfc !== true) {
                    notifyPatientAboutPendingCaretakerRequest(mongoose, caretakerRequestEntity);
                    timedNotifications[requestId] = setTimeout(
                        _.partial(nagPatientAboutPendingCaretakerRequest, mongoose, requestId),
                        exports.hackishIsDebug ? 500 : __minutes_to_milliseconds(exports.NAG_INTERVAL_MINUTES)
                    );
                }
            }
        }
    });
}

function createInitialTasks(mongoose) {
    mongoose.models.Caretaker.find({ status: 'pending', hidden: 'false' }, function(err, pendingCaretakerEntities) {
        if (err) {
            logger.error('Failed to obtain all pending caretaker requests for initializing cron tasks');
        } else {
            _.map(pendingCaretakerEntities, function (caretakerEntity) {
                nagPatientAboutPendingCaretakerRequest(mongoose, caretakerEntity.request_id);
            });
        }
    });
}

exports.nagPatientAboutPendingCaretakerRequest = nagPatientAboutPendingCaretakerRequest;
exports.createInitialTasks = createInitialTasks;

