/**
 * Created by noa on 15/04/17.
 */
require('./models/db');

var _ = require('lodash');
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var mongoose    = require('mongoose');

var UserModel = require('./models/user');

//route() will allow you to use same path for different HTTP operation.
//So if you have same URL but with different HTTP OP such as POST,GET etc
//Then use route() to remove redundant code.

router.route("/users")
    .get(function(req, res){
        mongoose.models.User.find({ }, function(err, data) {
            res.json({
                error: err ? err : false,
                "message" : err ? "Error fetching data" : data
            });
        });
    })
    .post(function(req, res){
        // If user exists, update it. Otherwise create new user.
        mongoose.models.User.find({ username: req.body.username }, function(err, data) {
            if (data.length > 0) {
                var existingUser = data[0];
                existingUser.email = req.body.email ? req.body.email : existingUser.email;
                existingUser.password = req.body.password ? req.body.password : existingUser.password; // TODO: hash the password
                existingUser.patients = req.body.patients ? req.body.patients : existingUser.patients;
                existingUser.save(function(err) {
                    res.status(_.get(err, 'name') === 'ValidationError' ? 400 : 500).json({
                        "error" : err ? err : false,
                        "message" : err ? "Error updating data" : "Updated user " + existingUser.username
                    });
                });
            } else {
                var newUser = new UserModel({ // TODO: deconstructing statement from req.body, ECMA6.
                    username: req.body.username,
                    password: req.body.password,
                    patients: req.body.patients
                });
                newUser.save(function(err) {
                    res.status(_.get(err, 'name') === 'ValidationError' ? 400 : 500).json({
                        "error" : err ? err : false,
                        "message" : err ? "Error creating user" : "Created user " + newUser.username
                    });
                });
            }
        });
    });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
app.use('/', router);
app.listen(3000);
console.log("Listening to PORT 3000");
