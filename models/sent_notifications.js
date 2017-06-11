var data_types = require('./data_types');
var mongoose = require('mongoose');

var SentNotification = data_types.createSchema({
    recipient_userid: { type: String, required: true },
    patient_userid: { type: String, required: true },
    message: { type: mongoose.SchemaTypes.Mixed, required: true }
});

module.exports = mongoose.model('SentNotification', SentNotification, 'SentNotification');
