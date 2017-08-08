var data_types = require('./data_types');
var mongoose = require('mongoose');

var CaretakerSchema = data_types.createSchema({
    patient_email: { type: String, required: false, nullable: true, default: null },
    nfc: { type: Boolean, required: false, nullable: true, default: false },
    request_id: { type: String, required: true, nullable: false, unique: true },
    caretaker: { type: String, required: true },
    patient: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'accepted', 'rejected'] }
});

module.exports = mongoose.model('Caretaker', CaretakerSchema, 'Caretaker');
