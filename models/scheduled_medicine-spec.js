var _ = require('lodash');
var expect = require('chai').expect;
var ScheduledMedicine = require('./scheduled_medicine');

var scheduledMedicineGood = new ScheduledMedicine({
    scheduled_medicine_id: 'x',
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
expect(scheduledMedicineGood.validateSync()).to.be.undefined;

var scheduledMedicineBad = new ScheduledMedicine({
    scheduled_medicine_id: 'y',
    userid: 'a',
    medicine_id: 'b',
    dosage_size: 1,
    frequency: {
        day_of_week: '',
        month_of_year: '*',
        day_of_month: '*',
        hour: '*',
        minute: '*'
    }
});
expect(_.get(scheduledMedicineBad.validateSync(), ['errors', 'frequency', 'message']))
    .to.equal('Joined frequency components form an invalid cron expression');
// expect(scheduledMedicineGood.validateSync().errors.frequency).to.be.undefined;