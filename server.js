/**
 * Created by noa on 15/04/17.
 */

// TODO: Consider using node.js Cluster or other current mechanism for catching errors and restarting the server.

require('./models/db');

var _ = require('lodash');
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var mongoose    = require('mongoose');

var MedicineModel = require('./models/medicine');
var UserModel = require('./models/user');

function updateExistingMedicine(req, res) {
    var medicine_id = req.body.medicine_id;
    mongoose.models.Medicine.find({ medicine_id: medicine_id }, function(err, data) {
        if (data.length > 0) {
            var existingMedicine = data[0];
            _.forOwn(_.omit(req.body, 'medicine_id'), function(value, key) {
                existingMedicine[key] = value;
            });
            existingMedicine.save(function(err) {
                res.status(_.get(err, 'name') === 'ValidationError' ? 400 : 500).json({
                    "error" : err ? err : false,
                    "message" : (err ? "Error updating medicine " : "Updated medicine ") + medicine_id
                });
            });
        } else {
            res.status(400).json({
                "error" : true,
                "message" : "Medicine with medicine_id " + medicine_id + " does not exist. Use PUT for creation."
            });
        }
    });
}

function getAllMedicine(req, res) {
    mongoose.models.Medicine.find({ }, function(err, data) {
        res.json({
            error: err ? err : false,
            "message" : err ? "Error fetching data" : data
        });
    });
}

function createNewMedicine(req, res) {
    var medicine_id = req.body.medicine_id;
    mongoose.models.Medicine.find({ medicine_id: medicine_id }, function(err, data) {
        var newMedicine = new MedicineModel(req.body);
        newMedicine.save(function(err) {
            res.status(_.get(err, 'name') === 'ValidationError' ? 400 : 500).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating medicine " : "Created medicine ") + medicine_id
            });
        });
    });
}

function updateExistingUser(req, res) {
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
            res.status(400).json({
                "error" : true,
                "message" : "User with username " + req.body.username + " does not exist. Use PUT for creation."
            });
        }
    });
}

function createNewUser(req, res) {
    var username = req.body.username;
    mongoose.models.User.find({ username: username }, function(err, data) {
        var newUser = new UserModel(req.body);
        newUser.save(function(err) {
            res.status(_.get(err, 'name') === 'ValidationError' ? 400 : 500).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating user " : "Created user ") + username
            });
        });
    });
}

function getAllUsers(req, res) {
    mongoose.models.User.find({ }, function(err, data) {
        res.json({
            error: err ? err : false,
            "message" : err ? "Error fetching data" : data
        });
    });
}

router.route("/user")
    .get(getAllUsers)
    .post(updateExistingUser)
    .put(createNewUser);

router.route("/medicine")
    .get(getAllMedicine)
    .post(updateExistingMedicine)
    .put(createNewMedicine);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
app.use('/', router);
app.listen(3000);
console.log("Listening to PORT 3000");
