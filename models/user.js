/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');

var UserSchema = data_types.createSchema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    patients: [String]
});

exports.UserSchema = UserSchema;

var User = mongoose.model('User', UserSchema);
exports.User = User;
