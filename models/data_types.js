/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var mongoose = require('mongoose');

exports.createSchema = function(schemaProperties) {
    return mongoose.Schema(_.merge(schemaProperties, {
        creation_date: { type: Date, default: Date.now },
        hidden: { type: Boolean, default: false }
    })); // TODO: { strict: 'throw' }
};

exports.dosage_size_type = {
    type: Number,
    required: true,
    validate: { validator: function(v) { return v > 0 }, message: 'dosage_size must be positive' }
};
