/**
 * Created by noa on 5/20/17.
 */

const NUM_MINUTES_TO_WAIT = 2;
const NUM_MEDICINE = 15;

require('./firebaseNotify').hackishIsDebug = true;
const logger = require('./logger');

const moment = require('moment');
const _ = require('lodash');
const server = require('./server');
const http = require('http');
const expect = require('chai').expect;

const testDbName = 'temporaryTestDb';
const testAccessLog = './test_access.log';
const tweenyName = ['Tweeny', 'Peled'];
const tweenyPassword = 'ttt';
const tweenyEmail = 'tweenyhasleftthebuilding@gmail.com';

adminToken = null;
userIds = { };
jwtTokensForNonAdminUsers = { };

function getFromServer(token, path, callbackOnResponseData) {
    var getOptions = {
        path: path,
        host: 'localhost',
        port: '3000',
        headers: {
            'X-ACCESS-TOKEN': token
        }
    };
    http.get(getOptions, function(res) {
        expect(res.statusCode).to.be.lessThan(500);
        res.setEncoding('utf8');
        res.on('data', callbackOnResponseData);
    });
}

function putOrPostToServer(token, method, path, postBody, callbackOnResponseData) {
    var postOptions = {
        path: path,
        host: 'localhost',
        port: '3000',
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': token
        }
    };

    var postReq = http.request(postOptions, function(res) {
        expect(res.statusCode).to.be.lessThan(500);
        res.setEncoding('utf8');
        res.on('data', callbackOnResponseData);
    });

    // post the data
    postReq.write(JSON.stringify(postBody));
    postReq.end();
}

function allTestsDone() {
    logger.info('---------- All tests done ---------');
}

function waitThenCheckReminders() {
    setTimeout(function () {
        getFromServer(adminToken, '/sentnotification', function (sentNotificationEntities) {
            logger.info(sentNotificationEntities);
            expect(_.isEqual(
                ["med_1", "med_2", "med_3", "med_6"],
                _.map(JSON.parse(sentNotificationEntities).message, ent => ent.message.data.medicine_names[0]).sort()))
                .to.be.true;
            allTestsDone();
        });
    }, NUM_MINUTES_TO_WAIT * 60 * 1000);
}

function createSeveralScheduledMedicine() {
    const now = new Date();
    var i = 0;
    function createAnotherScheduledMedicine() {
        i++;
        if (i < NUM_MEDICINE) {
            putOrPostToServer(
                jwtTokensForNonAdminUsers[tweenyEmail],
                'PUT',
                '/scheduledmedicine/' + userIds['tweeny'],
                {
                    start_time: moment(now).subtract(6, 'days').endOf('day'),
                    medicine_id: "x" + i,
                    dosage_size: 3,
                    frequency: {
                        every_x_days: i,
                        hour: moment(now).add(NUM_MINUTES_TO_WAIT, 'minute').hour(),
                        minute: moment(now).add(NUM_MINUTES_TO_WAIT, 'minute').minute(),
                        day_of_week: "*", month_of_year: "*", day_of_month: "*"
                    }
                },
                createAnotherScheduledMedicine);
        } else {
            waitThenCheckReminders();
        }
    }
    createAnotherScheduledMedicine();
}

function createSeveralMedicine() {
    var i = 0;
    function createAnotherMedicine() {
        i++;
        if (i < NUM_MEDICINE) {
            putOrPostToServer(
                adminToken,
                'PUT',
                '/medicine/',
                {
                    medicine_id: "x" + i,
                    medicine_names: ['med_' + i],
                    route_of_administration: "oral",
                    dosage_form: "tablets"
                },
                createAnotherMedicine);
        } else {
            createSeveralScheduledMedicine();
        }
    }
    createAnotherMedicine();
}


function testLoginAsTweeny() {
    testGetUserToken(tweenyEmail, tweenyPassword, createSeveralMedicine);
}

function createNewUserAsAdmin(name, email, password, continueCallback) {
    // logger.info('createNewUserAsAdmin started with admin token ' + adminToken);
    putOrPostToServer(
        adminToken,
        'PUT',
        '/user',
        { name: name, email: email, password: password, push_tokens: ['mockPushTokenFor' + name[0]] },
        function (chunk) {
            var jsonBody = JSON.parse(chunk);
            logger.info(jsonBody);
            expect(jsonBody.error).to.be.false;
            expect(jsonBody.userid).to.be.defined;
            userIds[name[0].toLowerCase()] = jsonBody.userid;
            continueCallback();
        }
    )
}

function testGetUserToken(email, password, continueCallback) {
    putOrPostToServer(
        '',
        'POST',
        '/authenticate',
        { email: email, password: password },
        function (chunk) {
            var jsonBody = JSON.parse(chunk);
            logger.info(jsonBody);
            expect(jsonBody.error).to.be.false;
            expect(jsonBody.message).to.be.defined;
            expect(jsonBody.token).to.be.defined;
            jwtTokensForNonAdminUsers[email] = 'JWT ' + jsonBody.token;
            continueCallback();
        }
    );
}

function testCreateUserTweeny() {
    createNewUserAsAdmin(tweenyName, tweenyEmail, tweenyPassword, testLoginAsTweeny);
}

function testGetAdminJwtToken() {
    putOrPostToServer(
        '',
        'POST',
        '/authenticate',
        { userid: 'admin', password: 'gloola123!' },
        function (chunk) {
            var jsonBody = JSON.parse(chunk);
            // logger.info(jsonBody);
            expect(jsonBody.error).to.be.false;
            expect(jsonBody.message).to.be.defined;
            expect(jsonBody.token).to.be.defined;
            adminToken = 'JWT ' + jsonBody.token;
            testCreateUserTweeny();
        }
    );
}

function runServer() {
    server.serverMain(testDbName, testAccessLog);
    testGetAdminJwtToken();
}

function startTests() {
    var connection = require('mongoose').createConnection('mongodb://localhost:27017/' + testDbName, function(err){
        connection.db.dropDatabase(function(err){
            runServer();
        })
    });
}

startTests();
