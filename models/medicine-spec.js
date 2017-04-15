/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

describe('Medicine', function() {
    it('should be an existing model', function() {
        var Medicine = require('./medicine.js').Medicine;
        expect(Medicine).to.not.be.undefined;
    });

    it('should fail on creation of medicine without required fields', function() {
        var Medicine = require('./medicine.js').Medicine;
        var error = new Medicine().validateSync();
        expect(_.isEqual(
            _.keys(error.errors).sort(),
            ['medicine_id', 'manufacturer', 'dosage_form', 'route_of_administration'].sort()))
            .to.be.true;
    });

    // it('should succeed on creation of medicine without insertion to DB', function() {
    //     var Medicine = require('./medicine.js').Medicine;
    //     var error = new Medicine().validateSync();
    //     expect(_.isEqual(
    //         _.keys(error.errors).sort(),
    //         ['medicine_id', 'manufacturer', 'dosage_form', 'route_of_administration'].sort()))
    //         .to.be.true;
    // });
});
