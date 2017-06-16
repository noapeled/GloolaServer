/**
 * Created by noa on 15/04/17.
 */

// TODO: Consider using node.js Cluster or other current mechanism for catching errors and restarting the server.
// TODO: maybe hash user passwords?

var firebaseNotify = require('./firebaseNotify').firebaseNotify;
var schedulerForCaretakerRequests = require('./scheduler_caretaker_request');
var logger = require('./logger');
require('./db');
var schedulerForMedicine = require('./scheduler_medicine');
var addToFeed = require('./models/addToFeed').addToFeed;

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
    max_request_size_mb: 20,
    port: 3000,
    auth: {
        gloolaServerGoogleApiClientId: '546989006297-aecc06fnfkmgvf8v22jm2gshbt909md0.apps.googleusercontent.com',
        adminPassword: 'gloola123!',
        serverSecret: 'This is a secret string for signing tokens',
        tokenValidity: "30days"
    }
};

var modelNames = {
    caretaker: 'Caretaker',
    scheduledmedicine: 'ScheduledMedicine',
    user: 'User',
    medicine: 'Medicine',
    image: 'Image'
};

var modelNameToIdentifier = {
    Caretaker: 'request_id',
    ScheduledMedicine: 'scheduled_medicine_id',
    User: 'userid',
    Medicine: 'medicine_id',
    Image: 'image_id'
};

function __getPatientUserIds(caretakerUserId, callbackOnSuccess, callbackOnError) {
    mongoose.models.Caretaker.find( { caretaker: caretakerUserId, status: 'accepted' }, function (err, caretakerEntities) {
        err ? callbackOnError(err) : callbackOnSuccess(_.map(caretakerEntities, 'patient'));
    });
}

function __guid() {
    return Math.floor(Math.random() * 2000000000) + 1;
}

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

function updateExistingScheduledMedicine(req, res) {
    var scheduledMedicineId = req.params.entityId;
    mongoose.models.ScheduledMedicine.findOne({ scheduled_medicine_id: scheduledMedicineId }, function(err, scheduledMedicineEntity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching " + scheduledMedicineId });
        } else if (!scheduledMedicineEntity) {
            res.status(400).json({ error: true, message: scheduledMedicineId + " not found." });
        } else {
            // TODO: designate selected fields as non-updatable in schemas.
            var detailsToUpdate = _.omit(req.body, ['scheduled_medicine_id', 'userid', 'medicine_id']);
            _.forOwn(detailsToUpdate, function (value, key) {
                scheduledMedicineEntity[key] = value;
            });
            scheduledMedicineEntity.save(function (err) {
                if (_.isNull(err)) {
                    addToFeed(mongoose, scheduledMedicineEntity.userid, {
                        userid: scheduledMedicineEntity.userid,
                        scheduled_medicine_id: scheduledMedicineId,
                        when: (new Date()).toISOString(),
                        event: { type: 'scheduled_medicine_updated', 'contents': detailsToUpdate }
                    });
                    schedulerForMedicine.updateTimersForScheduledMedicine(mongoose, scheduledMedicineEntity);
                }
                res.status(statusCode(err)).json({
                    "error": err ? err : false,
                    "message": (err ? "Error updating " : "Updated ") + scheduledMedicineId
                });
            });
        }
    });
}

function updateExistingCaretaker(req, res) {
    var requestId = req.params.requestId;
    mongoose.models.Caretaker.findOne({ request_id: requestId }, function(err, caretakerRequestEntity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching " + requestId });
        } else if (!caretakerRequestEntity) {
            res.status(400).json({ error: true, message: "Caretaker request " + requestId + " not found." });
        } else {
            mongoose.models.User.findOne({userid: caretakerRequestEntity.caretaker}, function (err, caretakerUserEntity) {
                if (err) {
                    res.status(500).json({
                        error: err,
                        message: "Failed to fetch caretaker " + caretakerUserEntity.caretaker
                    });
                } else {
                    // TODO: designate selected fields as non-updatable in schemas.
                    var detailsToUpdate = _.omit(req.body, ['request_id', 'patient', 'caretaker']);
                    _.forOwn(detailsToUpdate, function (value, key) {
                        caretakerRequestEntity[key] = value;
                    });
                    caretakerRequestEntity.save(function (err) {
                        if (err) {
                            res.status(statusCode(err)).json({ "error": err, "message": "Error updating " + requestId });
                        } else {
                            firebaseNotify(
                                mongoose,
                                caretakerRequestEntity.patient,
                                [{
                                    recipientUserid: caretakerUserEntity.userid,
                                    push_tokens: caretakerUserEntity.push_tokens
                                }],
                                {
                                    type: 'caretaker_request_updated',
                                    request: caretakerRequestEntity.toObject()
                                });
                            res.json({ error: false, message: "Updated " + requestId });
                        }
                    });
                }
            });
        }
    });
}

function updateExistingEntity(req, res) {
    var model = modelNames[req.params.collection];
    var identifier = modelNameToIdentifier[model];
    var idOfEntityToBeUpdated = req.params.entityId;
    var query = _.fromPairs([[identifier, idOfEntityToBeUpdated]]);
    mongoose.models[model].findOne(query, function(err, entity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching " + identifier + " " + idOfEntityToBeUpdated});
        } else if (!entity) {
            res.status(400).json({ error: true, message: identifier + " " + idOfEntityToBeUpdated + " not found." });
        } else {
            // TODO: designate selected fields as non-updatable in schemas.
            var detailsToUpdate = _.omit(req.body, identifier);
            _.forOwn(detailsToUpdate, function (value, key) {
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
    var userid = req.decodedToken.userid;
    new mongoose.models.TakenMedicine(_.assign(req.body, { userid: userid }))
        .save(function(err, takenMedicineEntity) {
            addToFeed(mongoose, userid, {
                userid: userid,
                when: _.get(takenMedicineEntity, 'creation_date'),
                scheduled_medicine_id: takenMedicineEntity.scheduled_medicine_id,
                event: { type: 'scheduled_medicine_taken', contents: req.body }
            });
            res.status(statusCode(err)).json({
                "error" : err ? err : false,
                "message" : err ? "Error creating takenmedicine" : "Created takenmedicine"
            });
        });
}

function createNewCaretaker(req, res) {
    var patientEmail = req.body.patient_email;
    var caretakerUserid = req.decodedToken.userid;
    mongoose.models.User.findOne({ email: patientEmail }, function (err, patientUserEntity) {
        if (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: 'Could not find user by email ' + req.body.patient_email
            });
        } else {
            var newCaretaker = new mongoose.models.Caretaker({
                request_id: 'caretakerRequest' + __guid(),
                patient: patientUserEntity.userid,
                caretaker: caretakerUserid,
                status: 'pending'
            });
            newCaretaker.save(function(err) {
                if (err) {
                    res.status(statusCode(err)).json({
                        "error" : err ,
                        "message" : "Error creating caretaker for patient " + patientUserEntity.userid
                    });
                } else {
                    schedulerForCaretakerRequests.nagPatientAboutPendingCaretakerRequest(
                        mongoose, newCaretaker.request_id);
                    res.json({ "error" : false, "message" : newCaretaker });
                }
            });
        }
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
                logger.error('Failed to authenticate Google token, error is:', JSON.stringify(err.message));
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
    return req.decodedToken.userid === 'admin' || _.includes(['medicine', 'image', 'whoami'], req.params.collection) ?
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
            } else {
                __getPatientUserIds(
                    senderUserId,
                    function (patientUserIds) {
                        if (!_.includes(patientUserIds, requestedUserId)) {
                            res.status(403).json({
                                error: true,
                                message: 'User ' + senderUserId + ' is not authorized to access user ' + requestedUserId });
                        } else {
                            next();
                        }
                    },
                    function (err) {
                        res.status(statusCode(err)).json({
                            err: err,
                            message: 'Failed to retieve patients of ' + senderUserId })
                    }
                );
            }
        });
    }
}

function authorizeCreationOfEntity(req, res, next) {
    return req.decodedToken.userid === 'admin' || _.includes(['takenmedicine', 'caretaker'], req.params.collection) ?
        next() :
        res.status(403).json({
            error: true,
            message: 'User ' + req.decodedToken.userid + ' is not authorized to create new entities' });
}

function __getCaretakerUserEntities(patientUserid, callbackOnSuccess, callbackOnFailure) {
    mongoose.models.Caretaker.find({ patient: patientUserid, status: 'accepted' }, function (err, caretakers) {
        if (err) {
            callbackOnFailure(err);
        } else {
            mongoose.models.User.find({ userid: { $in: _.map(caretakers, 'caretaker') } }, function(err, caretakerUsers) {
                if (err) {
                    callbackOnFailure(err);
                } else {
                    callbackOnSuccess(caretakerUsers);
                }
            });
        }
    });
}

function getCaretakers(req, res) {
    var patientUserid = req.params.patientId;
    __getCaretakerUserEntities(
        patientUserid,
        function (caretakerUsers) {
            res.json({
                error: false,
                message: _.map(caretakerUsers,
                    function(caretakerUser) { return _.pick(caretakerUser, ['userid', 'name', 'email']); })
            });
        },
        function (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: "Error fetching caretakers of patient " + patientUserid
            });
        });
}

function createNewUserWithAutomaticId(req, res) {
    var newUser = _.assign(req.body, { userid: "user" + __guid() });
    new mongoose.models.User(newUser).save(function (err, userEntity) {
        if (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: "Error creating user"
            })
        } else {
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

function __addLastTaken(scheduledMedicineEntities, takenMedicineEntities) {
    return _.map(scheduledMedicineEntities, function (schedMed) {
        return _.merge(schedMed.toObject(), {
            last_taken: _.pick(_(takenMedicineEntities)
                .filter({scheduled_medicine_id: schedMed.scheduled_medicine_id})
                .sortBy(['when'])
                .last(), ['when', 'dosage'])
        });
    });
}

function __addPatients(userEntityObject, req, res) {
    __getPatientUserIds(
        userEntityObject.userid,
        function (patientUserIds) {
            __addScheduledMedicineDetails(_.merge(userEntityObject, { patients: patientUserIds }), req, res);
        },
        function (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: 'Failed to retrieve patients of ' + userEntityObject.userid
            });
        }
    );
}

function __addScheduledMedicineDetails(userEntityObject, req, res) {
    mongoose.models.ScheduledMedicine.find({ userid: userEntityObject.userid, hidden: false }, function(err, scheduledMedicineEntities) {
        if (err) {
            res.status(statusCode(err)).json(
                { error: err, message: 'Failed to retrieve scheduled medicine for user ' + userEntityObject.userid });
        } else {
            // TODO: inefficient, try to formulate a query with aggregate, which takes the latest of each medicine of the user.
            mongoose.models.TakenMedicine.find({userid: userEntityObject.userid}, function (err, takenMedicineEntities) {
                if (err) {
                    res.status(500).json({
                        error: err,
                        mesage: "Failed to retrieve taken medicine for user " + userEntityObject.userid
                    });
                } else {
                    res.json({
                        error: false,
                        message: _.merge(userEntityObject,
                            { medical_info: {
                                medication: __addLastTaken(scheduledMedicineEntities, takenMedicineEntities) }
                            })
                    })
                }
            });
        }
    });
}

function getUserWithAdditionalDetails(req, res) {
    var userid = req.params.userid;
    mongoose.models.User.findOne({ userid: userid }, function(err, userEntity) {
        if (err) {
            res.status(500).json({ error: err, mesage: "Error fetching user " + userid});
        } else if (!userEntity) {
            res.status(400).json({ error: true, message: "No user " + userid });
        } else {
            __addPatients(userEntity.toObject(), req, res);
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

function initializeLoggingDbSchedulers(dbName, logFilePath) {
    setupLogging(logFilePath);

    // Connect mongoose to database.
    require('./db').connectToDatabase(dbName);

    schedulerForMedicine.createInitialTasks(mongoose);
    schedulerForCaretakerRequests.createInitialTasks(mongoose);
}

function createNewScheduledMedicine(req, res) {
    var userid = req.params.userid;
    var newScheduledMedicine = _.assign(req.body, {
        userid: userid,
        scheduled_medicine_id: "scheduledMedicine" + __guid() });
    new mongoose.models.ScheduledMedicine(newScheduledMedicine).save(function (err, scheduledMedicineEntity) {
        if (err) {
            res.status(statusCode(err)).json({
                error: err,
                message: "Error creating scheduledMedicine"
            })
        } else {
            addToFeed(mongoose, userid, {
                userid: userid,
                when: scheduledMedicineEntity.creation_date,
                scheduled_medicine_id: scheduledMedicineEntity.scheduled_medicine_id,
                event: { type: 'scheduled_medicine_created', contents: scheduledMedicineEntity.toObject() }
            });
            schedulerForMedicine.updateTimersForScheduledMedicine(mongoose, scheduledMedicineEntity);
            res.json({
                error: false,
                message: "Created scheduledMedicine " + scheduledMedicineEntity.scheduled_medicine_id,
                scheduled_medicine_id: scheduledMedicineEntity.scheduled_medicine_id
            });
        }
    });
}

function getFeed(req, res) {
    var userid = req.params.userid;
    mongoose.models.FeedEvent.find({ userid: userid }, function(err, feedEventEntities) {
        res.status(statusCode(err)).json({
            error: err ? err : false,
            message: err ? 'Failed to retrieve feed events for ' + userid : _.sortBy(feedEventEntities, 'when')
        });
    });
}

function initializeAuthentication() {
    // For obtaining a token from the server, rather than from Google.
    router.route("/authenticate")
        .post(authenticate);
    // All requests must first have their token verified, no matter the origin of the token.
    router.use(verifyToken);
    router.route("/:collection")
        .put(authorizeCreationOfEntity)
        .get(authorizeAccessToEntireCollection)
        .post(authorizeAccessToEntireCollection);
    router.route("/user/:userid")
        .get(authorizeAccessToUserEntity)
        .post(authorizeAccessToUserEntity);
}

function initializeRoutes() {
    router.route("/whoami")
        .get(whoAmI);

    router.route("/caretaker/:requestId")
        .post(updateExistingCaretaker);

    router.route("/feed/:userid")
        .get(getFeed);

    router.route("/scheduledmedicine/:entityId")
        .post(updateExistingScheduledMedicine);

    router.route("/scheduledmedicine/:userid")
        .put(createNewScheduledMedicine);

    router.route("/medicine/names/:substringToMatch")
        .get(getMedicineNamesByRegex);

    // Next, access to collections.
    router.route("/user")
        .put(createNewUserWithAutomaticId);

    router.route("/user/:userid")
        .get(getUserWithAdditionalDetails);

    router.route("/takenmedicine")
        .put(createNewTakenMedicine);

    router.route("/takenmedicine/:userid")
        .get(getLatestTakenMedicine);

    router.route('/caretaker')
        .put(createNewCaretaker);

    router.route('/:collection')
        .get(getAllEntitiesInCollection)
        .put(createNewEntity);

    router.route('/allcaretakers/:patientId')
        .get(getCaretakers);

    router.route('/:collection/:entityId')
        .post(updateExistingEntity)
        .get(getByEntityId);
}

function initializeApp() {
    app.use(bodyParser.json({ limit: config.max_request_size_mb + 'mb' }));
    app.use(bodyParser.urlencoded({ limit: config.max_request_size_mb + 'mb', extended: true }));
    app.use('/', router);
    app.listen(config.port);
    logger.info("Listening to PORT " + config.port);
}

function serverMain(dbName, logFilePath) {
    initializeLoggingDbSchedulers(dbName, logFilePath);
    initializeAuthentication();
    initializeRoutes();
    initializeApp();
}

exports.serverMain = serverMain;
