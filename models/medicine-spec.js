/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

describe('Medicine', function() {
    it('should be an existing model', function() {
        var Medicine = require('./medicine.js');
        expect(Medicine).to.exist;
    });

    it('should fail on creation of medicine without required fields', function() {
        var Medicine = require('./medicine.js');
        var error = new Medicine().validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['medicine_id'].sort())).to.be.true;
    });

    it('should fail on creation of medicine with required fields set to null', function() {
        var Medicine = require('./medicine.js');
        var error = new Medicine({ medicine_id: null }).validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['medicine_id'].sort())).to.be.true;
    });

    it('should succeed on creation of medicine with only required fields', function() {
        var Medicine = require('./medicine.js');
        var medicine = new Medicine({ medicine_id: '1234' });
        expect(medicine.validateSync()).to.be.undefined;
    });

    it('should have default basic properties for medicine created with only required fields', function() {
        var Medicine = require('./medicine.js');
        var medicine = new Medicine({ medicine_id: '1234' });
        expect(medicine.hidden).to.be.false;
        expect(medicine.creation_date).to.exist;
    });

    it('should succeed on creation of medicine with all fields except basic properties', function() {
        var Medicine = require('./medicine.js');
        var medicine = new Medicine({
            medicine_id: '1234',
            medicine_names: ['foofoofoo', 'barbarbar'],
            images: [],
            route_of_administration: 'oral',
            dosage_form: 'tablet',
            manufacturer: 'barfoo',
            basic_dose: '1.12'
        });
        expect(medicine.validateSync()).to.be.undefined;
    });

    // it('should refuse too low mg. per dosage', function() {
    //     var Medicine = require('./medicine.js');
    //     var error = new Medicine({ medicine_id: '1234', mg_per_dosage: 1E-6 }).validateSync();
    //     expect(_.get(error, ['errors', 'mg_per_dosage', 'message'])).to.match(
    //         /^Too low mg per dosage, minimum is \d+\.?\d*$/);
    // });
});
