/**
 * Created by noa on 16/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');
require('mongoose-type-email');

// function regexpForCronStyleValue(numbersString) {
//     return new RegExp('^([*])|((' + numbersString + ',)*' + numbersString + ')$');
// }

var PatientSchema = data_types.createSchema({
    patient_id: { type: String, required: true },
    name: {
        type: [String],
        validate: { validator: function(v) { return v.length >= 2 }, message: 'name must consist of at least forname and surname' }
    },
    birthdate: Date,
    hmo: { type: String, enum: ['clalit', 'maccabi', 'meuhedet', 'leumit', null], default: null },
    email: mongoose.SchemaTypes.Email,
    medication: [{
        medicine_id: { type: String, required: true },
        dosage_size: {
            type: Number,
            required: true,
            validate: { validator: function(v) { return v > 0 }, message: 'dosage_size must be positive' }
        },
        frequency: [{ // TODO: validate precise cron-style patterns
            day_of_week: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
            month_of_year: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
            day_of_month: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
            hour: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
            minute: { type: String, match: /^((\*)|((\d+,)*\d+))$/ }
        }]
    }]
});

exports.PatientSchema = PatientSchema;

var Patient = mongoose.model('Patient', PatientSchema);
exports.Patient = Patient;
