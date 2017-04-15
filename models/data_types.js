/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var mongoose = require('mongoose');

exports.createSchema = function(schemaProperties) {
    return mongoose.Schema(_.merge(schemaProperties, {
        creation_date: { type: Date, default: Date.now },
        hidden: { type: Boolean, default: false }
    }));
};

