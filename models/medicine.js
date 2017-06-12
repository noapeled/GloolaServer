/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');

var MedicineSchema = data_types.createSchema({
    medicine_id: { type: String, required: true, nullable: false, unique: true },
    medicine_names: [String],
    images: [],
    route_of_administration: {type: String},
    dosage_form: String,
    manufacturer: String,
    basic_dose: {type: String}
});

module.exports = mongoose.model('Medicine', MedicineSchema, 'Medicine');
