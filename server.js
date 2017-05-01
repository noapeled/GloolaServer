/**
 * Created by noa on 15/04/17.
 */

// TODO: Consider using node.js Cluster or other current mechanism for catching errors and restarting the server.
// TODO: maybe hash user passwords?

require('./models/db');

var jwt = require('jsonwebtoken');
var _ = require('lodash');
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var mongoose    = require('mongoose');

var UserModel = require('./models/user');

var config = {
    port: 3000,
    auth: {
        tokenFeatureFlag: false,
        adminPassword: 'gloola123!',
        serverSecret: 'This is a secret string for signing tokens',
        tokenValidity: "1day"
    }
};

var modelNameToIdentifier = {
    User: 'username',
    Medicine: 'medicine_id',
    Patient: 'patient_id',
    Image: 'image_id'
};

function updateExistingEntity(req, res) {
    var model = _.startCase(req.params.collection);
    var identifier = modelNameToIdentifier[model];
    var query = _.fromPairs([[identifier, req.body[identifier]]]);
    mongoose.models[model].findOne(query, function(err, entity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching " + identifier + " " + req.body[identifier]});
        } else if (!entity) {
            res.status(400).json({ error: true, message: identifier + " " + req.body[identifier] + " not found." });
        } else {
            _.forOwn(_.omit(req.body, identifier), function (value, key) {
                entity[key] = value;
            });
            entity.save(function (err) {
                res.status(statusCode(err)).json({
                    "error": err ? err : false,
                    "message": (err ? "Error updating " : "Updated ") + identifier + " " + req.body[identifier]
                });
            });
        }
    });
}

function createNewEntity(req, res) {
    var model = _.startCase(req.params.collection);
    var identifier = modelNameToIdentifier[model];
    var query = _.fromPairs([[identifier, req.params.entityId]]);
    mongoose.models[model].find(query, function(err, data) {
        new mongoose.models[model](req.body).save(function(err) {
            res.status(statusCode(err)).json({
                "error" : err ? err : false,
                "message" : (err ? "Error creating " : "Created ") + identifier + " " + req.body[identifier]
            });
        });
    });
}

function getByEntityId(req, res) {
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
    // TODO: allow GET for all medicine and image
    return req.decodedToken.username === 'admin' || _.includes(['medicine', 'image'], req.params.collection) ?
        next() :
        res.status(403).json({
            err: true,
            message: 'User ' + req.decodedToken.username + ' is not authorized to access all ' + req.params.collection
        });
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

function authorizeCreationOfEntity(req, res, next) {
    return req.decodedToken.username === 'admin' ?
        next() :
        res.status(403).json({
            error: true,
            message: 'User ' + req.decodedToken.username + ' is not authorized to create new entities' });
}

function serverMain() {
    if (config.auth.tokenFeatureFlag) {
        router.route("/authenticate")
            .post(authenticate);
        router.use(verifyToken);
        router.route("/:collection")
            .put(authorizeCreationOfEntity)
            .all(authorizeAccessToEntireCollection);
        router.route("/user/:userId")
            .all(authorizeAccessToUserEntity);
        router.route("/patient/:patientId")
            .all(authorizeAccessToPatientEntity);
    }

    router.route("/user")
        .get(getAllUsers);

    router.route("/medicine")
        .get(getAllMedicine);

    router.route("/patient")
        .get(getAllPatients)
        .post(updateExistingPatient);

    router.route('/:collection')
        .post(updateExistingEntity)
        .put(createNewEntity);

    router.route('/:collection/:entityId')
        .get(getByEntityId);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({"extended": false}));
    app.use('/', router);

    app.listen(config.port);
    console.log("Listening to PORT " + config.port);
}

serverMain();
