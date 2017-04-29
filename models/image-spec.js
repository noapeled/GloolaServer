/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

describe('Image', function() {
    it('should be an existing model', function() {
        var Image = require('./image.js');
        expect(Image).to.exist;
    });

    it('should fail on creation of image without required fields', function() {
        var Image = require('./image.js');
        var error = new Image().validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['image_id'].sort())).to.be.true;
    });

    it('should succeed on creation of image with only required fields', function() {
        var Image = require('./image.js');
        var image = new Image({ image_id: '1234' });
        expect(image.validateSync()).to.be.undefined;
    });

    // TODO
    // it('should fail on creation of two images with same image_id', function() {
    // });

    it('should have default basic properties for image created with only required fields', function() {
        var Image = require('./image.js');
        var image = new Image({ image_id: '1234' });
        expect(image.hidden).to.be.false;
        expect(image.creation_date).to.exist;
    });

    it('should succeed on creation of image with all fields except basic properties', function() {
        var Image = require('./image.js');
        var image = new Image({
            image_id: '1234',
            image_names: ['foofoofoo', 'barbarbar'],
            images: [],
            route_of_administration: 'oral',
            dosage_form: 'tablet',
            manufacturer: 'barfoo',
            basic_dose: '1.12'
        });
        expect(image.validateSync()).to.be.undefined;
    });

    it('should verify validity of base64 encoding of image contents', function() {
        var Image = require('./image.js');
        var image = new Image({
            image_id: '1234',
            image_names: ['foofoofoo', 'barbarbar'],
            images: [],
            route_of_administration: 'oral',
            dosage_form: 'tablet',
            manufacturer: 'barfoo',
            basic_dose: '1.12'
        });
        expect(image.validateSync()).to.be.undefined;
    });
});
