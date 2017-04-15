/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');
var _ = require('lodash');

var MedicineSchema = data_types.createSchema({
    medicine_id: _.merge(data_types.LimitedLengthString, { required: true }),
    medicine_names: [data_types.LimitedLengthString],
    images: [],
    route_of_administration: _.merge(data_types.LimitedLengthString, {
        enum: ['oral', 'intravenous']
    }),
    dosage_form: data_types.LimitedLengthString,
    manufacturer: data_types.LimitedLengthString,
    mg_per_dosage: { type: Number, min: [0.001, 'Too low mg per dosage'] }
});

exports.MedicineSchema = MedicineSchema;

var Medicine = mongoose.model('Medicine', MedicineSchema);
exports.Medicine = Medicine;
