/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;

describe('Medicine', function() {
    it('should be an existing model', function() {
        var Medicine = require('./medicine.js').Medicine;
        expect(Medicine).to.not.be.undefined;
    });
});
