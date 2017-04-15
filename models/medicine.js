/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');
var _ = require('lodash');

var MIN_MG_PER_DOSAGE = 0.001;

var MedicineSchema = data_types.createSchema({
    medicine_id: { type: String, required: true, nullable: false },
    medicine_names: [String],
    images: [],
    route_of_administration: {type: String, enum: ['oral', 'intravenous']},
    dosage_form: String,
    manufacturer: String,
    mg_per_dosage: { type: Number, min: [MIN_MG_PER_DOSAGE, 'Too low mg per dosage, minimum is ' + MIN_MG_PER_DOSAGE] }
});

exports.MedicineSchema = MedicineSchema;

var Medicine = mongoose.model('Medicine', MedicineSchema);
exports.Medicine = Medicine;
