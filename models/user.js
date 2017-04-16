/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');
require('mongoose-type-email');

var UserSchema = data_types.createSchema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: mongoose.SchemaTypes.Email,
    patients: [String]
});

module.exports = mongoose.model('User', UserSchema, 'User');
