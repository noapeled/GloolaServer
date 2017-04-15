/**
 * Created by noa on 15/04/17.
 */

var LimitedLengthString = require('./data_types').LimitedLengthString;
var mongoose = require('mongoose');
var _ = require('lodash');

var MedicineSchema = mongoose.Schema({
    medicine_id: _.merge(LimitedLengthString, { required: true }),
    medicine_names: [LimitedLengthString],
    images: [],
    route_of_administration: _.merge(LimitedLengthString, {
        enum: ['oral', 'intravenous']
    }),
    dosage_form: LimitedLengthString,
    manufacturer: LimitedLengthString,
    mg_per_dosage: { type: Number, min: [0.001, 'Too low mg per dosage'] }
});

var Medicine = mongoose.model('Medicine', MedicineSchema);
