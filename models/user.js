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
        medication: [{
            medicine_id: { type: String, required: true },
            dosage_size: data_types.dosage_size_type,
            frequency: [{ // TODO: validate precise cron-style patterns
                day_of_week: String,
                month_of_year: String,
                day_of_month: String,
                hour: String,
                minute: String
            }]
        }]
    },
    push_tokens: [String]
});

module.exports = mongoose.model('User', UserSchema, 'User');
