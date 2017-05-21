/**
 * Created by inon on 5/20/17.
 */

var _ = require('lodash');
var omitDeep = require('omit-deep-lodash');

var testDbName = 'temporaryTestDb';

require('./server').serverMain(testDbName);

var http = require('http');
var expect = require('chai').expect;

var tweenyName = ['Tweeny', 'Peled'];
var tuliName = ['Tuli', 'Peled'];
var tweenyPassword = 'ttt';
var tuliPassword = 'lll';
var tweenyEmail = 'tweeny@t.com';
var tuliEmail = 'tuli@t.com';

var medicalData = {
    medication: [{
        medicine_id: "3334123",
        dosage_size: 2,
        frequency: [
            { day_of_week: "*", month_of_year: "*", day_of_month: "*", hour: "20", minute: "15" },
            { day_of_week: "3,7", month_of_year: "*", day_of_month: "*", hour: "09", minute: "00" }
        ]
    }]
};

adminToken = null;
userIds = { };
userTokens = { };

function getFromServer(jwtToken, path, callbackOnResponseData) {
    var getOptions = {
        path: path,
        host: 'localhost',
        port: '3000',
        headers: {
            'X-ACCESS-TOKEN': jwtToken
        }
    };
    http.get(getOptions, function(res) {
        res.setEncoding('utf8');
        res.on('data', callbackOnResponseData);
    });
}

function putOrPostToServer(jwtToken, method, path, postBody, callbackOnResponseData) {
    var postOptions = {
        path: path,
        host: 'localhost',
        port: '3000',
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-ACCESS-TOKEN': jwtToken
        }
    };

    var postReq = http.request(postOptions, function(res) {
        res.setEncoding('utf8');
        res.on('data', callbackOnResponseData);
    });

    // post the data
    postReq.write(JSON.stringify(postBody));
    postReq.end();
}

function allTestsDone() {
    console.log("All tests done.");
}

function testLatestTakenMedicine() {
    getFromServer(userTokens[tuliEmail], '/takenmedicine/latest=10', function (data) {
        console.log(data);
        expect(JSON.parse(data).message.length).to.equal(1);
        expect(new Date(JSON.parse(data).message[0].when)).to.equal(new Date('2017-05-19T23:33:45Z'));
        allTestsDone();
    })
}

function testTuliReportsTakenMedicine() {
    putOrPostToServer(userTokens[tuliEmail], 'PUT', '/takenmedicine', {
        when: '2017-05-19T23:33:45Z', medicine_id: 'x123', dosage: 1.2
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testLatestTakenMedicine();
    });
}

function testTuliHasMedicine() {
    getFromServer(userTokens[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        console.log(data);
        expect(JSON.parse(data).message.medical_info.medication.length).to.equal(1);
        // console.log(omitDeep(JSON.parse(data).message.medical_info, '_id'));
        expect(_.isEqual(omitDeep(JSON.parse(data).message.medical_info, '_id'), medicalData)).to.be.true;
        testTuliReportsTakenMedicine();
    })
}

function testTweenyCanAddMedicineToTuli() {
    putOrPostToServer(userTokens[tweenyEmail], 'POST', '/user/' + userIds['tuli'], { medical_info: medicalData}, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliHasMedicine();
    });
}

function testTuliHasCaretakerTweeny() {
    getFromServer(userTokens[tweenyEmail], '/caretakers/' + userIds['tuli'], function (data) {
       console.log(data);
       var caretakers = JSON.parse(data).message;
       expect(caretakers.length).to.equal(1);
       expect(_.isEqual(caretakers[0], { userid: userIds['tweeny'], 'name': tweenyName, 'email': tweenyEmail })).to.be.true;
       testTweenyCanAddMedicineToTuli();
    });
}

function testTweenyCanSeeDetailsOfTuli() {
    getFromServer(userTokens[tweenyEmail], '/user/' + userIds['tuli'], function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliHasCaretakerTweeny();
    });
}

function testTweenyHasPatientTuli(data) {
    console.log(data);
    getFromServer(userTokens[tweenyEmail], '/user/' + userIds['tweeny'], function (data) {
        console.log(data);
        expect(JSON.parse(data).message.patients).to.contain(userIds['tuli']);
        testTweenyCanSeeDetailsOfTuli();
    });
}

function testSetTweenyAsCaretakerOfTuli() {
    console.log(userTokens);
    console.log(userIds);
    putOrPostToServer(userTokens[tweenyEmail], 'POST', '/user/' + userIds['tweeny'], {
        patients: [userIds['tuli']]
    }, function (chunk) {
        console.log(chunk);
        var jsonBody = JSON.parse(chunk);
        expect(jsonBody.error).to.be.false;
        testTweenyHasPatientTuli();
    });
}

function testTuliCanSeeItsOwnDetails() {
    getFromServer(userTokens[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        expect(JSON.parse(data).error).to.be.false;
        testSetTweenyAsCaretakerOfTuli();
    })
}

function testLoginAsTuli() {
    testGetUserToken(tuliEmail, tuliPassword, testTuliCanSeeItsOwnDetails);
}

function testLoginAsTweeny() {
    testGetUserToken(tweenyEmail, tweenyPassword, testLoginAsTuli);
}

function testCreateUserTuli() {
    createNewUserAsAdmin(tuliName, tuliEmail, tuliPassword, testLoginAsTweeny);
}

function createNewUserAsAdmin(name, email, password, continueCallback) {
    // console.log('createNewUserAsAdmin started with admin token ' + adminToken);
    putOrPostToServer(
        adminToken,
        'PUT',
        '/user',
        { name: name, email: email, password: password },
        function (chunk) {
            var jsonBody = JSON.parse(chunk);
            console.log(jsonBody);
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
            console.log(jsonBody);
            expect(jsonBody.error).to.be.false;
            expect(jsonBody.message).to.be.defined;
            expect(jsonBody.token).to.be.defined;
            userTokens[email] = jsonBody.token;
            continueCallback();
        }
    );
}

function testGetAdminToken() {
    putOrPostToServer(
        '',
        'POST',
        '/authenticate',
        { userid: 'admin', password: 'gloola123!' },
        function (chunk) {
            var jsonBody = JSON.parse(chunk);
            // console.log(jsonBody);
            expect(jsonBody.error).to.be.false;
            expect(jsonBody.message).to.be.defined;
            expect(jsonBody.token).to.be.defined;
            adminToken = jsonBody.token;
            continueNowThatAdminTokenIsKnown();
        }
    );
}

function testCreateUserTweeny() {
    createNewUserAsAdmin(tweenyName, tweenyEmail, tweenyPassword, testCreateUserTuli);
}

function continueNowThatAdminTokenIsKnown() {
    require('mongoose').connection.dropDatabase(testDbName);
    testCreateUserTweeny();
}

testGetAdminToken();
