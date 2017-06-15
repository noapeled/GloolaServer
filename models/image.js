/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var data_types = require('./data_types');
var mongoose = require('mongoose');

var ImageSchema = data_types.createSchema({
    image_id: { type: String, required: true, nullable: false, unique: true },
    format: { type: String, required: true, nullable: false, unique: false },
    contents: { type: String, required: true, nullable: false }
});

module.exports = mongoose.model('Image', ImageSchema, 'Image');
