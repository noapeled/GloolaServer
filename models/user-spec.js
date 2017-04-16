/**
 * Created by noa on 15/04/17.
 */
'use strict';
var expect = require('chai').expect;
var _ = require('lodash');

describe('User', function() {
    it('should be an existing model', function() {
        var User = require('./user.js').User;
        expect(User).to.exist;
    });

    it('should fail on creation of user without required fields', function() {
        var User = require('./user.js').User;
        var error = new User().validateSync();
        expect(_.isEqual(_.keys(error.errors).sort(), ['username', 'password'].sort())).to.be.true;
    });

    it('should succeed on creation of user with only required fields', function() {
        var User = require('./user.js').User;
        var user = new User({ username: 'foofoouser', password: 'barbarpassword' });
        expect(user.validateSync()).to.be.undefined;
    });

    it('should have default basic properties for user created with only required fields', function() {
        var User = require('./user.js').User;
        var user = new User({ username: 'foofoouser', password: 'barbarpassword' });
        expect(user.hidden).to.be.false;
        expect(user.creation_date).to.exist;
    });

    it('should succeed on creation of user with all fields except basic properties', function() {
        var User = require('./user.js').User;
        var user = new User({
            username: 'foofoouser',
            password: 'barbarpassword',
            patients: ['1234', '6677']
        });
        expect(user.validateSync()).to.be.undefined;
    });
});
