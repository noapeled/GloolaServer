/**
 * Created by noa on 15/04/17.
 */

var _ = require('lodash');
var mongoose = require('mongoose');

exports.createSchema = function(schemaProperties) {
    return mongoose.Schema(_.merge(schemaProperties, {
        creation_date: { type: Date, default: Date.now },
        hidden: { type: Boolean, default: false },
        update_history: [{ date: Date, contents: mongoose.Schema.Types.Mixed }]
    })); // TODO: { strict: 'throw' }
};

exports.positive_number_type = {
    type: Number,
    required: true,
    validate: { validator: function(v) { return v > 0 }, message: 'must be positive' }
};
