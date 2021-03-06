/**
 * Created by noa on 5/20/17.
 */

const NAG_OFFSET_MINUTES = 1.0 / 60.0;
const ALERT_OFFSET_MINUTES = 1.5 / 60.0;

var fs = require('fs');
var inspect = require('util').inspect;
var logger = require('./logger');
require('./firebaseNotify').hackishIsDebug = true;

var _ = require('lodash');
var testDbName = 'temporaryTestDb';

var schedulerForMedicine = require('./scheduler_medicine');
schedulerForMedicine.hackishIsDebug = true;

var schedulerForCaretaker = require('./scheduler_caretaker_request');
schedulerForCaretaker.hackishIsDebug = true;

var testAccessLog = './test_access.log';

var server = require('./server');

var http = require('http');
var expect = require('chai').expect;

var tweenyGoogleToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ3MWJjZmJmMDY2ZmFlNWNkNTVkNmYyZmVjZWEyMDlhZjQ3YTQ0MDcifQ.eyJhenAiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcxNDc3Njk3MDYzODk1ODA4NjEiLCJlbWFpbCI6InR3ZWVueWhhc2xlZnR0aGVidWlsZGluZ0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjFuVjhTNmZVajNQTW1lMEFRRk1IMkEiLCJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiaWF0IjoxNDk2NTgxMjMwLCJleHAiOjE0OTY1ODQ4MzAsIm5hbWUiOiJUd2VlbnkgUGVsZWQiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDYuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1QOXloYXFFeVJlUS9BQUFBQUFBQUFBSS9BQUFBQUFBQUFBQS9BQXlZQkY3bVZ1YThNNEJ4WklNTU9WR1IxQlVkYTFJQWZ3L3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJUd2VlbnkiLCJmYW1pbHlfbmFtZSI6IlBlbGVkIiwibG9jYWxlIjoiZW4ifQ.PnjNzUY9oliH_GF1uQ2AmwNDdZotHBnfna0x2aXgKEpE_bzEdg61h9XYSIbMHS6Y6TgRHCeMf1OadyrMEZeREOtQKLs7Lueh9zzXLMqDH3I5WITvRdvDnQZA1KFOHvKRHVW972Cmqe_LlFZi4fj_nAJhmXIQMmme9-Y47IryJGZ_xAJhCIQYSg5gQfsKnJB81vrtUmc86P9nyZfA23J1pp06ZWYksj1TomCb7u455-KxikYnLd0JM69mdp6-wBw9kfIBrXNBBPsGcruR4cOTVA1CZxk6Kx-CzHwvFYlBQ27fNspjZEQba4aV-sMEoW6Mt8jCRx2kvFFOhEpZiaKYcQ';
var tweenyName = ['Tweeny', 'Peled'];
var tuliName = ['Tuli', 'Peled'];
var tweenyPassword = 'ttt';
var tuliPassword = 'lll';
var tweenyEmail = 'tweenyhasleftthebuilding@gmail.com';
var tuliEmail = 'tuli@t.com';

var shuntziName = ['Shuntzi', 'Edwardo'];
var shuntziPassword = 'zzz';
var shuntziEmail = 'shuntzi@z.com';

var scheduledMedicineX777 = {
    start_time: new Date(),
    medicine_id: "x777",
    dosage_size: 1.11,
    frequency: { day_of_week: "*", month_of_year: "*", day_of_month: "*", hour: "*", minute: "*" },
    nag_offset_minutes: NAG_OFFSET_MINUTES,
    alert_offset_minutes: ALERT_OFFSET_MINUTES
};
var scheduledMedicineX123 = {
    start_time: new Date(),
    instructions: "Swallow with water",
    medicine_id: "x123",
    dosage_size: 2,
    frequency: { day_of_week: "3,7", month_of_year: "*", day_of_month: "*", hour: "09", minute: "00" }
};
var medicalData = { medication: [scheduledMedicineX777, scheduledMedicineX123]};

scheduledMedicineIdForTestingNoNags = null;
shuntziSecondCaretakerRequestId = null;
shuntziFirstCaretakerRequestId = null;
tweenyCaretakerRequestID = null;
scheduledMedicineIdForX123 = null;
scheduledMedicineIdForX777 = null;
adminToken = null;
userIds = { };
jwtTokensForNonAdminUsers = { };
googleTokensForNonAdminUsers = _.fromPairs([[tweenyEmail, 'google ' + tweenyGoogleToken]]);


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

function testAllSentNotificationsAboutScheduledMedicineHaveMedicineNamesAndPatientDetails() {
    getFromServer(adminToken, '/sentnotification', function (data) {
       logger.info(data);
       var SentNotificationsAboutScheduledMedicine = _.filter(
            _.map(JSON.parse(data).message, obj => obj.message.data),
            obj => _.includes(
                ['reminder_take_medicine', 'nag_medicine_not_taken', 'alert_medicine_not_taken'], obj.type));
       expect(SentNotificationsAboutScheduledMedicine).to.not.be.empty;
       expect(_.every(SentNotificationsAboutScheduledMedicine,
           notification => notification.medicine_names.length > 0)).to.be.true;
       expect(_.every(SentNotificationsAboutScheduledMedicine,
           notification => !_.isEmpty(notification.patient.userid))).to.be.true;
       expect(_.every(SentNotificationsAboutScheduledMedicine,
           notification => !_.isEmpty(notification.patient.name))).to.be.true;
       expect(_.every(SentNotificationsAboutScheduledMedicine,
           notification => !_.isEmpty(notification.patient.email))).to.be.true;
       allTestsDone();
    });
}

function testAllPushNotificationsAboutUpdatesToCaretakerRequestsHavePatientEmail() {
    setTimeout(function () {
        getFromServer(adminToken, '/sentnotification', function (data) {
            var SentNotificationsAboutUpdatedCaretakerRequests = _.filter(
                    _.map(JSON.parse(data).message, obj => obj.message.data),
                obj => obj.type === 'caretaker_request_updated');
            expect(SentNotificationsAboutUpdatedCaretakerRequests).to.not.be.empty;
            expect(_.every(_.map(SentNotificationsAboutUpdatedCaretakerRequests, 'request.patient_email'),
                    n => n === tuliEmail)).to.be.true;
            testAllSentNotificationsAboutScheduledMedicineHaveMedicineNamesAndPatientDetails();
    }) }, 500);
}

function testTuliCanDenyTheSecondCaretakerRequestFromShuntzi() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'POST',
        '/caretaker/' + shuntziSecondCaretakerRequestId,
        { status: 'rejected' },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.equal(false);
            testAllPushNotificationsAboutUpdatesToCaretakerRequestsHavePatientEmail();
        }
    )
}

function testShuntziCanAskAgainToBeomeCaretakerOfTuli() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[shuntziEmail],
        'PUT',
        '/caretaker',
        { patient_email: tuliEmail },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            expect(JSON.parse(data).message.request_id).to.not.be.empty;
            shuntziSecondCaretakerRequestId = JSON.parse(data).message.request_id;
            expect(shuntziSecondCaretakerRequestId).to.not.equal(shuntziFirstCaretakerRequestId);
            testTuliCanDenyTheSecondCaretakerRequestFromShuntzi();
        });
}

function testShuntziDoesNotHavePatientTuli() {
    getFromServer(jwtTokensForNonAdminUsers[shuntziEmail], '/user/' + userIds['shuntzi'], function (data) {
        logger.info(data);
        expect(_.map(JSON.parse(data).message.patients, 'userid')).to.not.contain(userIds['tuli']);
        testShuntziCanAskAgainToBeomeCaretakerOfTuli();
    });
}

function testShuntziCanStopHisCaretakerRequest() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[shuntziEmail],
        'POST',
        '/caretaker/' + shuntziFirstCaretakerRequestId,
        { status: 'rejected' },
        function (data) {
            expect(JSON.parse(data).error).to.equal(false);
            testShuntziDoesNotHavePatientTuli();
        }
    )
}

function testShuntziCannotAskAgainWhenCaretakerRequestAccepted() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[shuntziEmail],
        'PUT',
        '/caretaker',
        { patient_email: tuliEmail },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.not.be.false;
            expect(_.map(JSON.parse(data).message, 'request_id')).to.contain(shuntziFirstCaretakerRequestId);
            testShuntziCanStopHisCaretakerRequest();
        });
}

function __expect_tuli_in_patients(responseData) {
    expect(_.some(JSON.parse(responseData).message.patients, {
        userid: userIds['tuli'],
        email: tuliEmail,
        name: tuliName
    })).to.be.true;
}

function testShuntziHasPatientTuli() {
    getFromServer(jwtTokensForNonAdminUsers[shuntziEmail], '/user/' + userIds['shuntzi'], function (data) {
        logger.info(data);
        __expect_tuli_in_patients(data);
        testShuntziCannotAskAgainWhenCaretakerRequestAccepted();
    });
}

function testTuliCanApproveCaretakerShuntzi() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'POST',
        '/caretaker/' + shuntziFirstCaretakerRequestId,
        { status: 'accepted' },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            testShuntziHasPatientTuli();
        });
}

function testShuntziCannotAskAgainWhileCaretakerRequestIsPending() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[shuntziEmail],
        'PUT',
        '/caretaker',
        { patient_email: tuliEmail },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.not.be.false;
            expect(_.map(JSON.parse(data).message, 'request_id')).to.contain(shuntziFirstCaretakerRequestId);
            testTuliCanApproveCaretakerShuntzi();
        });
}

function testShuntziCanAskToBeCaretakerOfTuliViaNFC() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[shuntziEmail],
        'PUT',
        '/caretaker',
        { nfc: true, patient_email: tuliEmail },
        function (data) {
            logger.info(data);
            logger.info('---------- There should be no push notification to Tuli about the caretaker request from Shuntzi! ----------');
            expect(JSON.parse(data).error).to.be.false;
            expect(JSON.parse(data).message.request_id).to.not.be.empty;
            expect(JSON.parse(data).message.nfc).to.be.true;
            shuntziFirstCaretakerRequestId = JSON.parse(data).message.request_id;
            testShuntziCannotAskAgainWhileCaretakerRequestIsPending();
        });
}

function testLoginAsShuntzi() {
    testGetUserToken(shuntziEmail, shuntziPassword, testShuntziCanAskToBeCaretakerOfTuliViaNFC);
}

function testCreateUserShuntzi() {
    createNewUserAsAdmin(shuntziName, shuntziEmail, shuntziPassword, testLoginAsShuntzi);
}

function testGetLimitedFeedOfPatient(limit) {
    getFromServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        '/feed/' + userIds['tuli'] + '?limit=' + limit,
        function (data) {
            logger.info(inspect(data));
            var feedEvents = JSON.parse(data).message;
            expect(feedEvents.length).to.equal(limit);
            expect(_.first(feedEvents).when).to.be.greaterThan(_.last(feedEvents).when);
            expect(_.isEqual(_.map(feedEvents, 'when').sort().reverse(), _.map(feedEvents, 'when'))).to.be.true;
            expect(_.every(_.map(feedEvents, event => !_.isEmpty(event.medicine_names)))).to.be.true;
            testCreateUserShuntzi();
        }
    );
}

function testGetFeedOfPatient() {
    getFromServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        '/feed/' + userIds['tuli'],
        function (data) {
            logger.info(inspect(data));
            var feedEvents = JSON.parse(data).message;
            expect(_.isEmpty(feedEvents)).to.be.false;
            expect(_.first(feedEvents).when).to.be.greaterThan(_.last(feedEvents).when);
            expect(_.isEqual(_.map(feedEvents, 'when').sort().reverse(), _.map(feedEvents, 'when'))).to.be.true;
            expect(_.every(_.map(feedEvents, event => !_.isEmpty(event.medicine_names)))).to.be.true;
            testGetLimitedFeedOfPatient(3);
        }
    );
}

function waitForSkippingOfNagsThenRemoveNaggingMedicine() {
    logger.info('------------- You should now see some skipping of nags, followed by resumed push notifications. -----------');
    setTimeout(function () {
        putOrPostToServer(
            jwtTokensForNonAdminUsers[tuliEmail],
            'POST',
            '/scheduledmedicine/' + scheduledMedicineIdForTestingNoNags,
            { hidden: true },
            function (data) {
                logger.info(data);
                expect(JSON.parse(data).error).to.be.false;
                testGetFeedOfPatient();
            });
    }, 10000);
}

function tuliCanAddMedicineForTestingNoNags() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'PUT',
        '/scheduledmedicine/' + userIds['tuli'],
        {
            no_notifications_if_taken_seconds_before_schedule: 7,
            start_time: new Date(),
            medicine_id: "z66666",
            dosage_size: 2.3,
            frequency: { day_of_week: "*", month_of_year: "*", day_of_month: "*", hour: "*", minute: "*" },
            nag_offset_minutes: NAG_OFFSET_MINUTES,
            alert_offset_minutes: ALERT_OFFSET_MINUTES
        },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            scheduledMedicineIdForTestingNoNags = JSON.parse(data).scheduled_medicine_id;
            putOrPostToServer(
                jwtTokensForNonAdminUsers[tuliEmail],
                'PUT',
                '/takenmedicine',
                { when: new Date(), scheduled_medicine_id: scheduledMedicineIdForTestingNoNags, dosage: 3 },
                function (data) {
                    logger.info(data);
                    expect(JSON.parse(data).error).to.be.false;
                    waitForSkippingOfNagsThenRemoveNaggingMedicine();
            });
        }
    );
}

function testPushNotificationsStopAfterRemovingLastMedicineOfTuli() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'POST',
        '/scheduledmedicine/' + scheduledMedicineIdForX777,
        { hidden: true },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            logger.info('------------- There should be no more push notifications about medicine to take. -----------');
            tuliCanAddMedicineForTestingNoNags();
        }
    );
}

function waitForNotifications() {
    logger.info("----------- You should see repeated push notifications now! ------------");
    setTimeout(testPushNotificationsStopAfterRemovingLastMedicineOfTuli, 5000);
}

function testGetMedicineNamesBySubstring() {
    getFromServer(jwtTokensForNonAdminUsers[tweenyEmail], '/medicine/names/LL', function (data) {
        logger.info(data);
        var sortedByMedicineId = _.sortBy(JSON.parse(data).message, ['medicine_id']);
        expect( _(sortedByMedicineId).differenceWith([
            { medicine_names: [ 'hello' ], medicine_id: 'x123' },
            { medicine_names: [ 'yellow' ], medicine_id: 'z66666' } ], _.isEqual).isEmpty()).to.be.true;
        waitForNotifications();
    })
}

function testCreateAnotherMedicine2() {
    putOrPostToServer(adminToken, 'PUT', '/medicine', {
        medicine_id: "y9990",
        medicine_names: ['this', 'medicine', 'has', 'a', 'few', 'names'],
        route_of_administration: "oral",
        dosage_form: "tablets"
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testGetMedicineNamesBySubstring();
    })
}

function testCreateAnotherMedicine1() {
    putOrPostToServer(adminToken, 'PUT', '/medicine', {
        medicine_id: "z66666",
        medicine_names: ['brick', 'yellow', 'road'],
        route_of_administration: "oral",
        dosage_form: "tablets"
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testCreateAnotherMedicine2();
    })
}

function testUserCanAccessAllMedicine() {
    getFromServer(jwtTokensForNonAdminUsers[tweenyEmail], '/medicine', function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        expect(_.isEqual(['x123', 'x777'], _.map(JSON.parse(data).message, 'medicine_id').sort())).to.be.true;
        testCreateAnotherMedicine1();
    })
}

function testUserCannotAccessAllUsers() {
    getFromServer(jwtTokensForNonAdminUsers[tweenyEmail], '/user', function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.true;
        testUserCanAccessAllMedicine();
    })
}

function testTuliCanSetScheduledMedicineToStartLater() {
    var numSecondsLater = 3;
    logger.info('----- Postponing scheduled medicine x777 for Tuli to start ' + numSecondsLater + ' seconds from now -------');
    var later = new Date();
    later.setSeconds(later.getSeconds() + numSecondsLater);
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'POST',
        '/scheduledmedicine/' + scheduledMedicineIdForX777,
        { start_time: later.toISOString() },
        function (data) { setTimeout(testUserCannotAccessAllUsers, numSecondsLater * 1000 + 3000); }
    )
}

function testTuliNowHasOnlyOneMedicine() {
    getFromServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        '/user/' + userIds['tuli'],
        function (data) {
            expect(_.get(JSON.parse(data), ['message', 'medical_info', 'medication']).length).to.equal(1);
            expect(JSON.parse(data).message.medical_info.medication[0].medicine_id).to.equal('x777');
            testTuliCanSetScheduledMedicineToStartLater();
        }
    )
}

function testTuliCanRemoveMedicine() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        'POST',
        '/scheduledmedicine/' + scheduledMedicineIdForX123,
        { hidden: true },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            testTuliNowHasOnlyOneMedicine();
        });
}

function testLastSingleTakenMedicine() {
    getFromServer(jwtTokensForNonAdminUsers[tuliEmail], '/takenmedicine/' + userIds['tuli'] + '?latest=1', function (data) {
        logger.info(data);
        expect(JSON.parse(data).message.length).to.equal(1);
        expect(JSON.parse(data).message[0].when).to.equal('2017-05-19T23:33:45.000Z');
        testTuliCanRemoveMedicine();
    })
}

function testAllLatestTakenMedicine() {
    getFromServer(jwtTokensForNonAdminUsers[tuliEmail], '/takenmedicine/' + userIds['tuli'] + '?latest=40', function (data) {
        logger.info(data);
        expect(JSON.parse(data).message.length).to.equal(2);
        expect(JSON.parse(data).message[0].when).to.equal('2017-05-19T23:33:45.000Z');
        testLastSingleTakenMedicine();
    })
}

function testLastTaken() {
    getFromServer(jwtTokensForNonAdminUsers[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        var medication = JSON.parse(data).message.medical_info.medication;
        var indexOfX777 = medication[0].scheduled_medicine_id === scheduledMedicineIdForX777 ? 0 : 1;
        var indexOfX123 = 1 - indexOfX777;
        expect(medication[indexOfX777].last_taken.when).to.equal("2017-05-19T23:33:45.000Z");
        expect(medication[indexOfX777].last_taken.dosage).to.equal(1.2);
        expect(medication[indexOfX123].last_taken.when).to.equal("2016-01-01T12:00:00.000Z");
        expect(medication[indexOfX123].last_taken.dosage).to.equal(3);
        testAllLatestTakenMedicine();
    })

}

function testTuliReportsTakenMedicine2() {
    putOrPostToServer(jwtTokensForNonAdminUsers[tuliEmail], 'PUT', '/takenmedicine', {
        when: '2016-01-01T12:00:00Z', scheduled_medicine_id: scheduledMedicineIdForX123, dosage: 3
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testLastTaken();
    });
}

function testTuliReportsTakenMedicine1() {
    putOrPostToServer(jwtTokensForNonAdminUsers[tuliEmail], 'PUT', '/takenmedicine', {
        when: '2017-05-19T23:33:45Z', scheduled_medicine_id: scheduledMedicineIdForX777, dosage: 1.2
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliReportsTakenMedicine2();
    });
}

function testTuliHasMedicine() {
    getFromServer(jwtTokensForNonAdminUsers[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        logger.info(data);
        expect(JSON.parse(data).message.medical_info.medication.length).to.equal(2);
        // logger.info(omitDeep(JSON.parse(data).message.medical_info, '_id'));
        expect(_.isEqual(
            _.map(JSON.parse(data).message.medical_info.medication, 'medicine_id'),
            _.map(medicalData.medication, 'medicine_id')
        )).to.be.true;
        expect(_.every(JSON.parse(data).message.medical_info.medication, { 'last_taken': { } })).to.be.true;
        testTuliReportsTakenMedicine1();
    })
}

function testTweenyCanAddScheduledMedicineX123ToTuli() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        'PUT',
        '/scheduledmedicine/' + userIds['tuli'],
        scheduledMedicineX123,
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            scheduledMedicineIdForX123 = JSON.parse(data).scheduled_medicine_id;
            testTuliHasMedicine();
        }
    );
}

function testTweenyCanAddScheduledMedicineX777ToTuli() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        'PUT',
        '/scheduledmedicine/' + userIds['tuli'],
        scheduledMedicineX777,
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            scheduledMedicineIdForX777 = JSON.parse(data).scheduled_medicine_id;
            testTweenyCanAddScheduledMedicineX123ToTuli();
        }
    );
}

function testCannotCreateScheduleMedicineWithZeroDosage() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        'PUT',
        '/scheduledmedicine/' + userIds['tuli'],
        {
            start_time: new Date(),
            medicine_id: "y333",
            dosage_size: 0,
            frequency: { day_of_week: "*", month_of_year: "*", day_of_month: "*", hour: "*", minute: "*" }
        },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.not.be.false;
            expect(data).to.contain("must be positive");
            testTweenyCanAddScheduledMedicineX777ToTuli();
        }
    );
}

function testAdminCanAddImageToMedicine() {
    putOrPostToServer(adminToken, 'POST', '/medicine/x123', {
        images: ['image555']
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testCannotCreateScheduleMedicineWithZeroDosage();
    });
}

function testAdminCanUploadLargeImage() {
    var base64Contents = (new Buffer(fs.readFileSync('./large.bmp'))).toString('base64') + '=';
    putOrPostToServer(adminToken, 'PUT', '/image', {
        image_id: 'large',
        format: 'bmp',
        contents: base64Contents
    }, function (data) {
        expect(JSON.parse(data).error).to.be.false;
        testAdminCanAddImageToMedicine();
    });
}

function testAdminCanCreateNewImage() {
    putOrPostToServer(adminToken, 'PUT', '/image', {
        image_id: 'image555',
        format: 'png',
        contents: 'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACcFBMVEUAAACXJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB/////0TRaIAAAAznRSTlMAAAYoRFBKMw894vf7+fJ+ZK4EBQIBIarcQgUABQESlIw9adr+7pQ3bao3AoL98vj98PzAGDvq/nsDnP3SiWd4uPbZICHe/JwcCmfs/V0PlPi3EgF2/cUvCIf/+VQc18MgXP7mJwSupwJe/uQkA6qpAgFz/vZHFM62EQh07aQJYPn7px4k4fd9DAJI3v1hB6z4tGJCUZTq4ypL8/33+/+PAgea/P3/+//TJR+0sWCM7vq1WpTLTRAJBT2/5mIQAxMDarQGR/ONDEZpd3BWHo3mDFUAAAABYktHRM+D3sJpAAAAB3RJTUUH4QQdEwoufmazaQAAAYVJREFUKM9jYKAPYGRiZmFlY+dgZMQuzcnFzcPLx49LWuAcCAgKoUszMgqLMIqKiYOlJSSlGKVlZJHUMMrJKygqKauApc+pqqlraGohrGDU1tE9p6d/DgYMDI3OGZswwo02NTuHDswtYNoZLa0gQtY2tnb2Do4QjpMzTNrFFSzg5u7ByMjo6eUN5vn4wqT9/ANAAoFBIAHG4JBQEC8sHG55RGTUuXPRMRDbGGPjgLLxCUhOT0w6dy45BcJnTE0DSqdnIDzOmJl17lx2DlQ6Nw8onV+A0FxYVHzuXEkp1PCycqB0RSXcY1XVNSDH1NaBncZY3wDkNDY1w6RbWsFeaWvvAHqss6sbzOvphUn39UNCYsLESZOnTJ0G4UyfAZNmnDkLGpSz58ydB2XOXwD398JF584tXgIP76XLlp9bsRLhcsZVq9esXbceKrth46bNW7YipRlGxm3bGXfs3AWW3b1nL+O+/Qcwk8xBsPShwzjS2pGjIOljuJLi8RMnT50+cxaHNPUBAKaI25/rA/PEAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA0LTI5VDE5OjEwOjQ2KzAyOjAwaQg1YQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wNC0yOVQxOToxMDo0NiswMjowMBhVjd0AAAAASUVORK5CYII='
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testAdminCanUploadLargeImage();
    });
}

function testAdminCanCreateNewMedicine() {
    logger.info('------In testAdminCanCreateNewMedicine-----------');
    putOrPostToServer(adminToken, 'PUT', '/medicine', {
        medicine_id: "x123",
        medicine_names: ['hello', 'world'],
        route_of_administration: "oral",
        dosage_form: "tablets"
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testAdminCanCreateNewImage();
    });
}

function testAdminCanGetAllUsers() {
    getFromServer(adminToken, '/user', function (data) {
        logger.info(data);
        expect(_.isEqual(
            [tuliEmail, tweenyEmail].sort(),
            _.map(JSON.parse(data).message, 'email').sort()
            )
        ).to.be.true;
        testAdminCanCreateNewMedicine();
    })
}

function testTuliCanGetHisRequestToBecomeCaredFor() {
    getFromServer(
        jwtTokensForNonAdminUsers[tuliEmail],
        '/caretakerrequest/' + userIds['tuli'],
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).message[0].request_id).to.equal(tweenyCaretakerRequestID);
            expect(JSON.parse(data).message[0].patient).to.equal(userIds['tuli']);
            expect(JSON.parse(data).message[0].status).to.equal('accepted');
            testAdminCanGetAllUsers();
        });
}

function testTweenyCanGetHisRequestToBecomeCaretaker() {
    getFromServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        '/caretakerrequest/' + userIds['tweeny'],
        function (data) {
            logger.info(data);
            expect(_.isEqual(JSON.parse(data).message[0].caretaker, {
                email: tweenyEmail,
                name: tweenyName,
                userid: userIds['tweeny']
            })).to.be.true;
            expect(JSON.parse(data).message[0].nfc).to.be.false;
            expect(JSON.parse(data).message[0].patient).to.equal(userIds['tuli']);
            expect(JSON.parse(data).message[0].request_id).to.equal(tweenyCaretakerRequestID);
            expect(JSON.parse(data).message[0].status).to.equal('accepted');
            testTuliCanGetHisRequestToBecomeCaredFor();
        });
}

function testTuliHasCaretakerTweeny() {
    getFromServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        '/allcaretakers/' + userIds['tuli'],
        function (data) {
           logger.info(data);
           var caretakers = JSON.parse(data).message;
           expect(caretakers.length).to.equal(1);
           expect(_.isEqual(caretakers[0], { userid: userIds['tweeny'], 'name': tweenyName, 'email': tweenyEmail })).to.be.true;
           testTweenyCanGetHisRequestToBecomeCaretaker();
        });
}

function testTweenyCanSeeDetailsOfTuli() {
    // TODO: Re-enable googleTokensForNonAdminUsers[tweenyEmail] after figuring out how to extend the token life.
    getFromServer(jwtTokensForNonAdminUsers[tweenyEmail], '/user/' + userIds['tuli'], function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliHasCaretakerTweeny();
    });
}

function testTweenyHasPatientTuli() {
    getFromServer(jwtTokensForNonAdminUsers[tweenyEmail], '/user/' + userIds['tweeny'], function (data) {
        logger.info(data);
        __expect_tuli_in_patients(data);
        testTweenyCanSeeDetailsOfTuli();
    });
}

function testTuliCanApproveCaretakerTweeny() {
    setTimeout(function () {
        putOrPostToServer(
            jwtTokensForNonAdminUsers[tuliEmail],
            'POST',
            '/caretaker/' + tweenyCaretakerRequestID,
            { status: 'accepted' },
            function (data) {
                logger.info(data);
                expect(JSON.parse(data).error).to.be.false;
                testTweenyHasPatientTuli();
            });
    }, 2000);
}

function testSetTweenyAsCaretakerOfTuli() {
    putOrPostToServer(
        jwtTokensForNonAdminUsers[tweenyEmail],
        'PUT',
        '/caretaker',
        { patient_email: tuliEmail },
        function (data) {
            logger.info(data);
            expect(JSON.parse(data).error).to.be.false;
            expect(JSON.parse(data).message.patient_email).to.equal(tuliEmail);
            expect(JSON.parse(data).message.caretaker).to.equal(userIds['tweeny']);
            expect(JSON.parse(data).message.patient).to.equal(userIds['tuli']);
            expect(JSON.parse(data).message.status).to.equal('pending');
            expect(JSON.parse(data).message.request_id).to.not.be.empty;
            tweenyCaretakerRequestID = JSON.parse(data).message.request_id;
            testTuliCanApproveCaretakerTweeny();
        });
}

function testTuliCanSeeItsOwnDetails() {
    getFromServer(jwtTokensForNonAdminUsers[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        expect(JSON.parse(data).error).to.be.false;
        testSetTweenyAsCaretakerOfTuli();
    })
}

function testLoginAsTuli() {
    testGetUserToken(tuliEmail, tuliPassword, testTuliCanSeeItsOwnDetails);
}

function testTweenyCanGetItsUseridByGoogleToken() {
    // TODO: Re-enable this function after figuring out how to extend the token life.
    getFromServer(googleTokensForNonAdminUsers[tweenyEmail], '/whoami', function (data) {
        logger.info(data);
       expect(JSON.parse(data).error).to.be.false;
       expect(JSON.parse(data).message.userid).to.equal(userIds['tweeny']);
       testLoginAsTuli();
    });
}

function testLoginAsTweeny() {
    testGetUserToken(tweenyEmail, tweenyPassword, testLoginAsTuli);
}

function testCreateUserTuli() {
    createNewUserAsAdmin(tuliName, tuliEmail, tuliPassword, testLoginAsTweeny);
}

function createNewUserAsAdmin(name, email, password, continueCallback) {
    // logger.info('createNewUserAsAdmin started with admin token ' + adminToken);
    putOrPostToServer(
        adminToken,
        'PUT',
        '/user',
        {
            name: name,
            email: email,
            password: password,
            push_tokens: ['mockPushTokenFor' + name[0]]
        },
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
    createNewUserAsAdmin(tweenyName, tweenyEmail, tweenyPassword, testCreateUserTuli);
}

function testCreateMedicineX777() {
    putOrPostToServer(adminToken, 'PUT', '/medicine', {
        medicine_id: "x777",
        medicine_names: ['ponpon', 'qqqqqq'],
        route_of_administration: "oral",
        dosage_form: "tablets"
    }, function (data) {
        logger.info(data);
        expect(JSON.parse(data).error).to.be.false;
        testCreateUserTweeny();
    })
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
            testCreateMedicineX777();
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
