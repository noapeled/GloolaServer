var data_types = require('./data_types');
var mongoose = require('mongoose');

var CaretakerSchema = data_types.createSchema({
    request_id: { type: String, required: true, nullable: false, unique: true },
    caretaker: { type: String, required: true },
    patient: { type: String, required: true },
    status: { type: String, required: true, enum: ['pending', 'accepted', 'denied'] }
});

module.exports = mongoose.model('Caretaker', CaretakerSchema, 'Caretaker');