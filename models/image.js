/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var data_types = require('./data_types');
var mongoose = require('mongoose');

var ImageSchema = data_types.createSchema({
    image_id: { type: String, required: true, nullable: false, unique: true },
    format: { type: String, required: true, nullable: false, unique: false },
    contents: { type: String, required: true, nullable: false, validate: {
        validator: function (v) {
            return _.isNull(v.match('[^A-Za-z0-9+/=]')) && _.endsWith(v, '=');
        },
        message: 'Invalid base64 encoding of contents'
    } }
});

module.exports = mongoose.model('Image', ImageSchema, 'Image');
