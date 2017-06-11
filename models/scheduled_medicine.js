var cron = require('node-cron');
var data_types = require('./data_types');
var mongoose = require('mongoose');

// TODO: validate precise cron-style patterns
var FrequencySchema = new mongoose.Schema({
    day_of_week: { type: String, required: true },
    month_of_year: { type: String, required: true },
    day_of_month: { type: String, required: true },
    hour: { type: String, required: true },
    minute: { type: String, required: true }
});

function getCronExpression(frequencyObject) {
    return [
        frequencyObject.minute,
        frequencyObject.hour,
        frequencyObject.day_of_month,
        frequencyObject.month_of_year,
        frequencyObject.day_of_week].join(' ');
}

var ScheduledMedicine = data_types.createSchema({
    scheduled_medicine_id: { type: String, required: true, nullable: false, unique: true },
    userid: { type: String, required: true },
    medicine_id: { type: String, required: true },
    dosage_size: data_types.dosage_size_type,
    frequency: { type: FrequencySchema, required: true, validate: {
        validator: function(frequencyObject) {return cron.validate(getCronExpression(frequencyObject));},
        message: 'Joined frequency components form an invalid cron expression' }
    },
    from_time: Date,
    to_time: Date
});

module.exports = mongoose.model('ScheduledMedicine', ScheduledMedicine, 'ScheduledMedicine');
module.exports.getCronExpression = getCronExpression;