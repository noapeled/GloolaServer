/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');
var _ = require('lodash');

var MedicineSchema = data_types.createSchema({
    medicine_id: { type: String, required: true, nullable: false },
    medicine_names: [String],
    images: [],
    route_of_administration: {type: String, enum: ['oral', 'intravenous']},
    dosage_form: String,
    manufacturer: String,
    mg_per_dosage: { type: Number, min: [0.001, 'Too low mg per dosage'] }
});

exports.MedicineSchema = MedicineSchema;

var Medicine = mongoose.model('Medicine', MedicineSchema);
exports.Medicine = Medicine;
