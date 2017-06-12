/**
 * Created by noa on 15/04/17.
 */

var data_types = require('./data_types');
var mongoose = require('mongoose');

var UserSchema = data_types.createSchema({
    name: { required: true, type: [String], validate: {
        validator: function(v) { return v.length >= 2 },
        message: 'name must consist of at least forname and surname' }
    },
    userid: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/ },
    push_tokens: [String]
});

module.exports = mongoose.model('User', UserSchema, 'User');
