/**
 * Created by noa on 15/04/17.
 */

// TODO: Consider using node.js Cluster or other current mechanism for catching errors and restarting the server.

require('./models/db');

var jwt = require('jsonwebtoken');
var _ = require('lodash');
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var mongoose    = require('mongoose');

var ImageModel = require('./models/image');
var PatientModel = require('./models/patient');
var MedicineModel = require('./models/medicine');
var UserModel = require('./models/user');

var config = {
    port: 3000,
    auth: {
        tokenFeatureFlag: true,
        adminPassword: 'gloola123!',
        serverSecret: 'This is a secret string for signing tokens',
        tokenValidity: "1day"
    }
};

function getByEntityId(req, res) {
    var modelNameToIdentifier = {
        User: 'username',
        Medicine: 'medicine_id',
        Patient: 'patient_id',
        Image: 'image_id'
    };
    var model = _.startCase(req.params.collection);
    var identifier = modelNameToIdentifier[model];
    var query = _.fromPairs([[identifier, req.params.entityId]]);
    mongoose.models[model].find(query, function(err, data) {
        return data && data.length <= 0 ?
            res.status(400).json({
                error: true,
                message: "No " + req.params.collection + " with " + identifier + " " + req.params.entityId}) :
            res.json({
                error: err ? err : false,
                "message": err ? "Error fetching data" : data[0] });
    });
}

function updateExistingImage(req, res) {
    mongoose.models.Image.find({ image_id: req.body.image_id }, function(err, data) {
        var existingImage = data[0];
        _.forOwn(_.omit(req.body, 'image_id'), function (value, key) {
            existingImage[key] = value;
        });
        existingImage.save(function (err) {
            res.status(statusCode(err)).json({
                "error": err ? err : false,
                "message": (err ? "Error updating image " : "Updated image ") + req.body.image_id
            });
        });
    })
}

function createNewImage(req, res) {
    mongoose.models.Image.find({ image_id: req.body.image_id }, function(err, data) {
        var newImage = new ImageModel(req.body);
        newImage.save(function(err) {
            res.status(statusCode(err)).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating image " : "Created image ") + req.body.image_id
            });
        });
    });
}

function statusCode(err) {
    var UNIQUE_KEY_ERROR_CODE = 11000;
    return _.get(err, 'name') === 'ValidationError' || _.get(err, 'code') === UNIQUE_KEY_ERROR_CODE ? 400 : 500;
}

function updateExistingPatient(req, res) {
    var patient_id = req.body.patient_id;
    mongoose.models.Patient.find({ patient_id: patient_id }, function(err, data) {
        var existingPatient = data[0];
        _.forOwn(_.omit(req.body, 'patient_id'), function (value, key) {
            existingPatient[key] = value;
        });
        existingPatient.save(function (err) {
            res.status(statusCode(err)).json({
                "error": err ? err : false,
                "message": (err ? "Error updating patient " : "Updated patient ") + patient_id
            });
        });
    })
}

function createNewPatient(req, res) {
    var patient_id = req.body.patient_id;
    mongoose.models.Patient.find({ patient_id: patient_id }, function(err, data) {
        var newPatient = new PatientModel(req.body);
        newPatient.save(function(err) {
            res.status(statusCode(err)).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating patient " : "Created patient ") + patient_id
            });
        });
    });
}

function getAllPatients(req, res) {
    mongoose.models.Patient.find({ }, function(err, data) {
        res.json({
            error: err ? err : false,
            "message" : err ? "Error fetching data" : data
        });
    });
}

function updateExistingMedicine(req, res) {
    var medicine_id = req.body.medicine_id;
    mongoose.models.Medicine.find({ medicine_id: medicine_id }, function(err, data) {
        if (data.length > 0) {
            var existingMedicine = data[0];
            _.forOwn(_.omit(req.body, 'medicine_id'), function(value, key) {
                existingMedicine[key] = value;
            });
            existingMedicine.save(function(err) {
                res.status(statusCode(err)).json({
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
            res.status(statusCode(err)).json({
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
                res.status(statusCode(err)).json({
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
            res.status(statusCode(err)).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating user " : "Created user ") + username
            });
        });
    });
}

function getAllUsers(req, res) {
    mongoose.models.User.find({ }, function(err, data) {
        res.json({
            "message" : err ? "Error fetching data" : data,
            error: err ? err : false
        });
    });
}

function authenticateAdmin(req, res) {
    if (req.body.password !== config.auth.adminPassword) {
        res.status(400).json({ error: true, message: 'Wrong password for admin' });
    } else {
        res.json({
            error: false,
            message: 'Successfully authenticated.',
            token: jwt.sign(
                { username: "admin" }, config.auth.serverSecret, { expiresIn: config.auth.tokenValidity })
        });
    }
}

function authenticateUserNotAdmin(req, res) {
    UserModel.findOne({ username: req.body.username }, function(err, user) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching user " + req.body.username});
        } else if (!user) {
            res.status(400).json(
                { error: true, message: 'User ' + req.body.username + ' not found.' });
        } else if (user.password !== req.body.password) {
            res.status(400).json(
                { error: true, message: 'Wrong password for user ' + req.body.username });
        } else {
            res.json({
                error: false,
                message: 'Successfully authenticated.',
                token: jwt.sign(
                    { username: user.username }, config.auth.serverSecret, { expiresIn: config.auth.tokenValidity })
            });
        }
    });
}

function authenticate(req, res) {
    return req.body.username === 'admin' ? authenticateAdmin(req, res) : authenticateUserNotAdmin(req, res);
}

function verifyToken(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({error: true, message: 'No token provided'});
    } else {
        jwt.verify(token, config.auth.serverSecret, function(err, decoded) {
            if (err) {
                return res.status(403).json({ error: err, message: 'Token authentication failed' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decodedToken = decoded;
                next();
            }
        });
    }
}

function authorizeAccessToEntireCollection(req, res, next) {
    return req.decodedToken.username !== 'admin' ?
        res.status(403).json({
            err: true,
            message: 'User ' + req.decodedToken.username + ' is not authorized to access all ' + req.params.collection
        }) :
        next();
}

function authorizeAccessToUserEntity(req, res, next) {
    return _.includes(['admin', req.params.userId], req.decodedToken.username) ?
        next() :
        res.status(403).json({
            error: true,
            message: 'User ' + req.decodedToken.username + ' is not authorized to access any other user' });
}

function authorizeAccessToPatientEntity(req, res, next) {
    var username = req.decodedToken.username;
    if (username === 'admin') {
        return next();
    } else {
        UserModel.findOne({ username: username }, function(err, user) {
            if (err) {
                res.status(500).json({ error: err, mesage: "Error fetching user " + username});
            } else if (!user) {
                res.status(400).json({ error: true, message: 'User ' + username + ' not found.' });
            } else if (!_.includes(user.patients, req.params.patientId)) {
                res.status(403).json({
                    error: true,
                    message: 'User ' + username + ' is not authorized to access patient ' + req.params.patientId });
            } else {
                next();
            }
        });
    }
}

if (config.auth.tokenFeatureFlag) {
    router.route("/authenticate")
        .post(authenticate);
    router.use(verifyToken);
    router.route("/:collection")
        .all(authorizeAccessToEntireCollection);
    router.route("/user/:userId")
        .all(authorizeAccessToUserEntity);
    router.route("/patient/:patientId")
        .all(authorizeAccessToPatientEntity)
}

router.route("/image")
    .post(updateExistingImage)
    .put(createNewImage);

router.route("/user")
    .get(getAllUsers)
    .post(updateExistingUser)
    .put(createNewUser);

router.route("/medicine")
    .get(getAllMedicine)
    .post(updateExistingMedicine)
    .put(createNewMedicine);

router.route("/patient")
    .get(getAllPatients)
    .post(updateExistingPatient)
    .put(createNewPatient);

router.route('/:collection/:entityId')
    .get(getByEntityId);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
app.use('/', router);

app.listen(config.port);
console.log("Listening to PORT " + config.port);
