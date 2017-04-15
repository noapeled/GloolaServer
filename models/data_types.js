/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var mongoose = require('mongoose');

exports.LimitedLengthString = {
    type: String,
    min: 0,
    max: 2048
};

exports.createSchema = function(schemaProperties) {
    return mongoose.Schema(_.merge(schemaProperties, {
        creation_date: { type: Date, default: Date.now },
        hidden: Boolean
    }));
};

