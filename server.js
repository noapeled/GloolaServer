/**
 * Created by noa on 15/04/17.
 */

// TODO: Consider using node.js Cluster or other current mechanism for catching errors and restarting the server.
// TODO: maybe hash user passwords?

require('./db');
var scheduler = require('./scheduler');

var GoogleAuth = require('google-auth-library');
var fs = require('fs');
var morgan = require('morgan');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var mongoose    = require('mongoose');

var config = {
    port: 3000,
    auth: {
        gloolaServerGoogleApiClientId: '546989006297-aecc06fnfkmgvf8v22jm2gshbt909md0.apps.googleusercontent.com',
        adminPassword: 'gloola123!',
        serverSecret: 'This is a secret string for signing tokens',
        tokenValidity: "30days"
    }
};

exports.schedulerFeatureFlag = false;

var modelNameToIdentifier = {
    User: 'userid',
    Medicine: 'medicine_id',
    Image: 'image_id'
};

function getAllEntitiesInCollection(req, res) {
    if (req.params.collection === 'image') {
        return res.status(400).json({
            error: true,
            message : "GET all images is disabled, payload may be very large"
        });
    } else {
        var model = _.startCase(req.params.collection);
        mongoose.models[model].find({}, function (err, data) {
            res.json({
                "message": err ? "Error fetching data" : data,
                error: err ? err : false
            });
        });
    }
}

function updateExistingEntity(req, res) {
    var model = _.startCase(req.params.collection);
    var identifier = modelNameToIdentifier[model];
    var idOfEntityToBeUpdated = req.params.entityId;
    var query = _.fromPairs([[identifier, idOfEntityToBeUpdated]]);
    mongoose.models[model].findOne(query, function(err, entity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching " + identifier + " " + idOfEntityToBeUpdated});
        } else if (!entity) {
            res.status(400).json({ error: true, message: identifier + " " + idOfEntityToBeUpdated + " not found." });
        } else {
            _.forOwn(_.omit(req.body, identifier), function (value, key) {
                entity[key] = value;
            });
            entity.save(function (err) {
                res.status(statusCode(err)).json({
                    "error": err ? err : false,
                    "message": (err ? "Error updating " : "Updated ") + identifier + " " + idOfEntityToBeUpdated
                });
            });
        }
    });
}

function createNewTakenMedicine(req, res) {
    new mongoose.models.TakenMedicine(_.assign(req.body, { userid: req.decodedToken.userid }))
        .save(function(err, data) {
        res.status(statusCode(err)).json({
            "error" : err ? err : false,
            "message" : err ? "Error creating takenmedicine" : "Created takenmedicine"
        });
    });
}

function createNewEntity(req, res) {
    var model = _.startCase(req.params.collection);
    var identifier = modelNameToIdentifier[model];
    new mongoose.models[model](req.body).save(function(err) {
        res.status(statusCode(err)).json({
            "error" : err ? err : false,
            "message" : (err ? "Error creating " : "Created ") + identifier + " " + req.body[identifier]
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
    if (_.isNull(err)) {
        return 200;
    } else if (_.get(err, 'name') === 'ValidationError' || _.get(err, 'code') === UNIQUE_KEY_ERROR_CODE) {
        return 400;
    } else {
        return 500;
    }
}

function authenticateAdmin(req, res) {
    if (req.body.password !== config.auth.adminPassword) {
        res.status(400).json({ error: true, message: 'Wrong password for admin' });
    } else {
        res.json({
            error: false,
            message: 'Successfully authenticated.',
            token: jwt.sign(
                { userid: "admin" }, config.auth.serverSecret, { expiresIn: config.auth.tokenValidity })
        });
    }
}

function authenticateUserNotAdmin(req, res) {
    query = req.body.userid ? { userid: req.body.userid } : { email: req.body.email };
    mongoose.models.User.findOne(query, function(err, user) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching user " + req.body.userid});
        } else if (!user) {
            res.status(400).json(
                { error: true, message: 'User ' + req.body.userid + ' not found.' });
        } else if (user.password !== req.body.password) {
            res.status(400).json(
                { error: true, message: 'Wrong password for user ' + req.body.userid });
        } else {
            res.json({
                error: false,
                message: 'Successfully authenticated ' + (req.body.userid || req.body.email),
                token: jwt.sign(
                    { userid: user.userid }, config.auth.serverSecret, { expiresIn: config.auth.tokenValidity })
            });
        }
    });
}

function authenticate(req, res) {
    return req.body.userid === 'admin' ? authenticateAdmin(req, res) : authenticateUserNotAdmin(req, res);
}

function verifyJwtToken(token, req, res, next) {
    jwt.verify(token, config.auth.serverSecret, function(err, decoded) {
        if (err) {
            return res.status(403).json({ error: err, message: 'JWT token authentication failed.' });
        } else {
            req.decodedToken = decoded;
            next();
        }
    });
}

function verifyGoogleToken(token, req, res, next) {
    var gauth = new GoogleAuth;
    var gauthClient = new gauth.OAuth2(config.auth.gloolaServerGoogleApiClientId, '', '');
    gauthClient.verifyIdToken(
        token,
        config.auth.gloolaServerGoogleApiClientId,
        function(err, loginData) {
            if (err) {
                console.log('Failed to authenticate Google token, error is:', JSON.stringify(err.message));
                return res.status(403).json({ error: true, message: err.message });
            }
            var payload = loginData.getPayload();
            if (!payload.email_verified) {
                return res.status(403).json({
                    error: true,
                    message: 'Google token does not indicate that email is verified'
                });
            }
            var email = payload['email'];
            mongoose.models.User.findOne({ email: email }, function(err, userEntity) {
                if (err) {
                    res.status(500).json({ error: err, mesage: "Error fetching user for email " + email });
                } else if (!userEntity) {
                    res.status(400).json({ error: true, message: 'No user found with email ' + email });
                } else {
                    req.decodedToken = _.assign(payload, { userid: userEntity.userid });
                    next();
                }
            })
        });
}

function verifyToken(req, res, next) {
    var tokenHeaderValue = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!tokenHeaderValue) {
        return res.status(403).json({ error: true, message: 'No token provided' });
    }
    if (tokenHeaderValue.toLowerCase().startsWith('jwt ')) {
        verifyJwtToken(tokenHeaderValue.substring('jwt '.length), req, res, next);
    } else if (tokenHeaderValue.toLowerCase().startsWith('google ')) {
        verifyGoogleToken(tokenHeaderValue.substring('google '.length), req, res, next);
    } else {
        return res.status(403).json({
            error: true,
            message: 'Token must start with "JWT " or "Google " (case-insensitive)'
        });
    }
}

function authorizeAccessToEntireCollection(req, res, next) {
    return req.decodedToken.userid === 'admin' || _.includes(['medicine', 'image'], req.params.collection) ?
        next() :
        res.status(403).json({
            error: true,
            message: 'User ' + req.decodedToken.userid + ' is not authorized to access all ' + req.params.collection
        });
}

function authorizeAccessToUserEntity(req, res, next) {
    var senderUserId = _.get(req, ['decodedToken', 'userid']);
    var requestedUserId = _.get(req, ['params', 'userid']);
    if (senderUserId === 'admin' || senderUserId === requestedUserId) {
        return next();
    } else {
        mongoose.models.User.findOne({ userid: senderUserId }, function(err, userEntity) {
            if (err) {
                res.status(500).json({ error: err, mesage: "Error fetching user " + requestedUserId});
            } else if (!userEntity) {
                res.status(400).json({ error: true, message: 'User ' + senderUserId + ' not found.' });
            } else if (!_.includes(userEntity.patients, requestedUserId)) {
                res.status(403).json({
                    error: true,
                    message: 'User ' + senderUserId + ' is not authorized to access user ' + requestedUserId });
            } else {
                next();
            }
        });
    }
}

function authorizeCreationOfEntity(req, res, next) {
    return req.decodedToken.userid === 'admin' || req.params.collection === 'takenmedicine' ?
        next() :
        res.status(403).json({
            error: true,
            message: 'User ' + req.decodedToken.userid + ' is not authorized to create new entities' });
}

function getCaretakers(req, res) {
    var requestedUserId = req.params.userid;
    mongoose.models.User.find({ patients: { $all: [requestedUserId] } }, function (err, caretakers) {
        res.json({
            message: err ? "Error fetching caretakers of user " + requestedUserId
                : _.map(caretakers, function(caretaker) { return _.pick(caretaker, ['userid', 'name', 'email']); }),
            error: err ? err : false
        })
    });
}

function createNewUserWithAutomaticId(req, res) {
    var newUser = _.assign(req.body, { userid: "user" + Math.floor(Math.random() * 2000000000) + 1 });
    new mongoose.models.User(newUser).save(function (err, userEntity) {
        if (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: "Error creating user"
            })
        } else {
            if (exports.schedulerFeatureFlag) {
                scheduler.updateTasksForUser(mongoose, userEntity);
            }
            res.json({
                error: false,
                message: "Created user " + userEntity.userid,
                userid: userEntity.userid
            });
        }
    });
}

function getLatestTakenMedicine(req, res) {
    mongoose.models.TakenMedicine.find({ userid: req.decodedToken.userid }, function (err, data) {
        res.json({
            "message": err ? "Error fetching data" : data,
            error: err ? err : false
        });
    })
        .sort({ when: -1 })
        .limit(parseInt(_.get(req, ['query', 'latest']) || "2000000000"));
}

function setupLogging(logFilePath) {
    // create a write stream (in append mode)
    var accessLogStream = fs.createWriteStream(logFilePath, { flags: 'a' });
    // setup the logger
    morgan.token('reqheaders', function (req, res) { return JSON.stringify(req.headers); });
    morgan.token('reqbody', function (req, res) { return JSON.stringify(req.body); });
    app.use(morgan(
        '[METHOD :method] [URL :url] [REQHEADERS :reqheaders] [REQBODY :reqbody] [RESSTATUS :status] [RESCONTENTLEN :res[content-length]] [RESTIMEMS :response-time]',
        { stream: accessLogStream })
    );
}

function addLastTaken(userEntity, takenMedicineEntities) {
    return _.merge(userEntity.toObject(), {
        medical_info: {
            medication: _.forEach(userEntity.toObject().medical_info.medication, function (med) {
                return _.merge(med, {
                    last_taken: _.pick(_(takenMedicineEntities)
                        .filter({medicine_id: med.medicine_id})
                        .sortBy(['when'])
                        .last(), ['when', 'dosage'])
                });
            })
        }
    });
}

function getUserWithLastTakenMedicine(req, res) {
    mongoose.models.User.findOne({ userid: req.params.userid }, function(err, userEntity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching user " + userid});
        } else if (!userEntity) {
            res.status(400).json({ error: true, message: "No user " + userid });
        } else {
            // TODO: inefficient, try to formulate a query which takes the latest of each medicine of the user.
            mongoose.models.TakenMedicine.find({ userid: userEntity.userid }, function(err, takenMedicineEntities) {
                if (err) {
                    res.status(500).json({ error: err, mesage: "Error fetching taken medicine for user " + userid});
                } else {
                    res.json({
                        error: false,
                        message: addLastTaken(userEntity, takenMedicineEntities)
                    })
                }
            })
        }
    });
}

function whoAmI(req, res) {
    res.json({
        error: false,
        message: { userid: req.decodedToken.userid }
    });
}

function getMedicineNamesByRegex(req, res) {
    var query = { medicine_names: { $elemMatch: { $regex: req.params.substringToMatch, $options: 'i' } } };
    mongoose.models.Medicine.find(query, function (err, medicineEntities ) {
       if (err) {
           res.status(400).json({ error: true, message: err } );
       } else {
           res.json({
               error: false,
               message: _.map(medicineEntities, function (med) {
                   return {
                       medicine_names: _.filter(med.medicine_names, function (name) {
                           return new RegExp(req.params.substringToMatch, 'i').test(name);
                       }),
                       medicine_id: med.medicine_id
                   };
                })
           });
       }
    });
}

function updateUser(req, res) {
    var userid = req.params.userid;
    mongoose.models.User.findOne({ userid: userid }, function(err, entity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching userid " + userid });
        } else if (!entity) {
            res.status(400).json({ error: true, message: "No user with userid " + userid });
        } else {
            _.forOwn(_.omit(req.body, 'userid'), function (value, key) {
                entity[key] = value;
            });
            entity.save(function (err, userEntity) {
                if (err) {
                    res.status(statusCode(err)).json({
                        error: err,
                        message: "Failed to update user " + userid
                    });
                } else {
                    if (exports.schedulerFeatureFlag) {
                        scheduler.updateTasksForUser(mongoose, userEntity);
                    }
                    res.json({
                        error: false,
                        message: "Updated user " + userid
                    });
                }
            });
        }
    });
}

function initializeLoggingDbScheduler(dbName, logFilePath) {
    setupLogging(logFilePath);

    // Connect mongoose to database.
    require('./db').connectToDatabase(dbName);

    if (exports.schedulerFeatureFlag) {
        scheduler.createInitialTasks(mongoose);
    }
}

function initializeAuthentication() {
    // For obtaining a token from the server, rather than from Google.
    router.route("/authenticate")
        .post(authenticate);

    // All requests must first have their token verified, no matter the origin of the token.
    router.use(verifyToken);
    // Find out the userid of the user making the request.
    router.route("/whoami")
        .get(whoAmI);
    router.route("/:collection")
        .put(authorizeCreationOfEntity)
        .get(authorizeAccessToEntireCollection)
        .post(authorizeAccessToEntireCollection);
    router.route("/user/:userid")
        .get(authorizeAccessToUserEntity)
        .post(authorizeAccessToUserEntity);
}

function initializeRoutes() {
    router.route("/medicine/names/:substringToMatch")
        .get(getMedicineNamesByRegex);

    router.route("/caretakers/:userid")
        .all(authorizeAccessToUserEntity);

    // Next, access to collections.
    router.route("/user")
        .put(createNewUserWithAutomaticId);

    router.route("/user/:userid")
        .post(updateUser)
        .get(getUserWithLastTakenMedicine);

    router.route("/takenmedicine")
        .put(createNewTakenMedicine);

    router.route("/takenmedicine/:userid")
        .get(getLatestTakenMedicine);

    router.route('/:collection')
        .get(getAllEntitiesInCollection)
        .put(createNewEntity);

    router.route('/caretakers/:userid')
        .get(getCaretakers);

    router.route('/:collection/:entityId')
        .post(updateExistingEntity)
        .get(getByEntityId);
}

function initializeApp() {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({"extended": false}));
    app.use('/', router);
    app.listen(config.port);
    console.log("Listening to PORT " + config.port);
}

function serverMain(dbName, logFilePath) {
    initializeLoggingDbScheduler(dbName, logFilePath);
    initializeAuthentication();
    initializeRoutes();
    initializeApp();
}

exports.serverMain = serverMain;
