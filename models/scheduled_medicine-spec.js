var expect = require('chai').expect;

var ScheduledMedicine = require('./scheduled_medicine');
var scheduledMedicine = new ScheduledMedicine({
    userid: 'a',
    medicine_id: 'b',
    dosage_size: 1,
    frequency: {
        day_of_week: '*',
        month_of_year: '*',
        day_of_month: '*',
        hour: '*',
        minute: '*'
    }
});

expect(scheduledMedicine.validateSync()).to.be.undefined;
