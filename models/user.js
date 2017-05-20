/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');

var UserSchema = data_types.createSchema({
    name: { required: true, type: [String], validate: {
        validator: function(v) { return v.length >= 2 },
        message: 'name must consist of at least forname and surname' }
    },
    userid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/ },
    patients: [String],
    medical_info: {
        hmo: { type: String, enum: ['clalit', 'maccabi', 'meuhedet', 'leumit', null], default: null },
        medication: [{
            medicine_id: { type: String, required: true },
            dosage_size: { type: Number, required: true, validate: {
                validator: function(v) { return v > 0 },
                message: 'dosage_size must be positive' }
            },
            frequency: [{ // TODO: validate precise cron-style patterns
                day_of_week: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
                month_of_year: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
                day_of_month: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
                hour: { type: String, match: /^((\*)|((\d+,)*\d+))$/ },
                minute: { type: String, match: /^((\*)|((\d+,)*\d+))$/ }
            }]
        }]
    },
    push_tokens: [String]
});

module.exports = mongoose.model('User', UserSchema, 'User');
