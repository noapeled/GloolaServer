const _ = require('lodash');

exports.getCaretakerUserEntities = function(mongoose, patientUserid, callbackOnSuccess, callbackOnFailure) {
    mongoose.models.Caretaker.find({ patient: patientUserid, status: 'accepted' }, function (err, caretakers) {
        if (err) {
            callbackOnFailure(err);
        } else {
            mongoose.models.User.find({ userid: { $in: _.map(caretakers, 'caretaker') } }, function(err, caretakerUsers) {
                if (err) {
                    callbackOnFailure(err);
                } else {
                    callbackOnSuccess(caretakerUsers);
                }
            });
        }
    });
};
