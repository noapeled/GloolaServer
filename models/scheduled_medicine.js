var data_types = require('./data_types');
var mongoose = require('mongoose');

var ScheduledMedicine = data_types.createSchema({
    scheduled_medicine_id: { type: String, required: true, nullable: false, unique: true },
    userid: { type: String, required: true },
    medicine_id: { type: String, required: true },
    dosage_size: data_types.dosage_size_type,
    frequency: { // TODO: validate precise cron-style patterns
        day_of_week: { type: String, required: true },
        month_of_year: { type: String, required: true },
        day_of_month: { type: String, required: true },
        hour: { type: String, required: true },
        minute: { type: String, required: true }
    },
    from_time: Date,
    to_time: Date
});

module.exports = mongoose.model('ScheduledMedicine', ScheduledMedicine, 'ScheduledMedicine');
