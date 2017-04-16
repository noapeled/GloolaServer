/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

describe('Patient', function() {
    it('should be an existing model', function() {
        var Patient = require('./patient.js').Patient;
        expect(Patient).to.exist;
    });

    it('should fail on creation of patient without required fields', function() {
        var Patient = require('./patient.js').Patient;
        var error = new Patient().validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['patient_id', 'name'].sort())).to.be.true;
    });


    it('should succeed on creation of patient with only required fields', function() {
        var Patient = require('./patient.js').Patient;
        var patient = new Patient({ patient_id: '0123456789', name: ['foofoofoo', 'barbarbar'] });
        expect(patient.validateSync()).to.be.undefined;
    });

    it('should have default basic properties for patient created with only required fields', function() {
        var Patient = require('./patient.js').Patient;
        var patient = new Patient({ patient_id: '0123456789', name: ['foofoofoo', 'barbarbar'] });
        expect(patient.hidden).to.be.false;
        expect(patient.creation_date).to.exist;
    });

    it('should succeed on creation of patient with all fields except basic properties', function() {
        var Patient = require('./patient.js').Patient;
        var patient = new Patient({
            patient_id: '1234',
            name: ['foofoofoo', 'barbarbar'],
            birthdate: '1934-08-22',
            hmo: 'clalit',
            email: 'foofoofoo@barbarbar.com',
            medication: [{
                medicine_id: '9999',
                dosage_size: 7,
                frequency: { day_of_week: '*', month_of_year: '*', day_of_month: '1,7,14,21', hour: '8', minute: '0' }
             }]
        });
        console.log(patient.validateSync())
        expect(patient.validateSync()).to.be.undefined;
    });
    //
    // it('should refuse too low mg. per dosage', function() {
    //     var Patient = require('./patient.js').Patient;
    //     var error = new Patient({ patient_id: '1234', mg_per_dosage: 1E-6 }).validateSync();
    //     expect(_.get(error, ['errors', 'mg_per_dosage', 'message'])).to.match(
    //         /^Too low mg per dosage, minimum is \d+\.?\d*$/);
    // });
});
