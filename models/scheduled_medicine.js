var cron = require('node-cron');
var data_types = require('./data_types');
var mongoose = require('mongoose');

// TODO: validate precise cron-style patterns
var __FrequencySchema = new mongoose.Schema({
    day_of_week: { type: String, required: true },
    month_of_year: { type: String, required: true },
    day_of_month: { type: String, required: true },
    hour: { type: String, required: true },
    minute: { type: String, required: true }
});

function getCronExpression(freqObj) {
    return [freqObj.minute, freqObj.hour, freqObj.day_of_month, freqObj.month_of_year, freqObj.day_of_week].join(' ');
}

var ScheduledMedicine = data_types.createSchema({
    instructions: String,
    scheduled_medicine_id: { type: String, required: true, nullable: false, unique: true },
    userid: { type: String, required: true },
    medicine_id: { type: String, required: true },
    dosage_size: data_types.positive_number_type,
    frequency: { type: __FrequencySchema, required: true, validate: {
        validator: function(frequencyObject) {return cron.validate(getCronExpression(frequencyObject));},
        message: 'Joined frequency components form an invalid cron expression' }
    },
    start_time: Date,
    end_time: Date,
    nag_offset_minutes: {
        type: Number,
        validate: { validator: function(v) { return v > 0 }, message: 'must be positive' },
        default: 30
    },
    alert_offset_minutes: {
        type: Number,
        validate: { validator: function(v) { return v > 0 }, message: 'must be positive' },
        default: 60
    }
});

module.exports = mongoose.model('ScheduledMedicine', ScheduledMedicine, 'ScheduledMedicine');
module.exports.getCronExpression = getCronExpression;