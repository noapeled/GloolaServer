/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');

var TakenMedicine = data_types.createSchema({
    userid: { type: String, required: true },
    when: { type: Date, required: true, nullable: false },
    scheduled_medicine_id: { type: String, required: true, nullable: false },
    dosage: data_types.positive_number_type
});

module.exports = mongoose.model('TakenMedicine', TakenMedicine, 'TakenMedicine');
