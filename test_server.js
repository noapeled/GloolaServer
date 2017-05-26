/**
 * Created by inon on 5/20/17.
 */

var _ = require('lodash');
var omitDeep = require('omit-deep-lodash');

var testDbName = 'temporaryTestDb';
var testAccessLog = './test_access.log';

require('./server').serverMain(testDbName, testAccessLog);

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
        medicine_id: "x123",
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
        expect(res.statusCode).to.be.lessThan(500);
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
        expect(res.statusCode).to.be.lessThan(500);
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

function testUserCanAccessAllMedicine() {
    getFromServer(userTokens[tweenyEmail], '/medicine', function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        expect(JSON.parse(data).message[0].medicine_id).to.equal('x123');
        allTestsDone();
    })
}

function testUserCannotAccessAllUsers() {
    getFromServer(userTokens[tweenyEmail], '/user', function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.true;
        testUserCanAccessAllMedicine();
    })
}

function testLastSingleTakenMedicine() {
    getFromServer(userTokens[tuliEmail], '/takenmedicine/' + userIds['tuli'] + '?latest=1', function (data) {
        console.log(data);
        expect(JSON.parse(data).message.length).to.equal(1);
        expect(JSON.parse(data).message[0].when).to.equal('2017-05-19T23:33:45.000Z');
        testUserCannotAccessAllUsers();
    })
}

function testAllLatestTakenMedicine() {
    getFromServer(userTokens[tuliEmail], '/takenmedicine/' + userIds['tuli'] + '?latest=40', function (data) {
        console.log(data);
        expect(JSON.parse(data).message.length).to.equal(2);
        expect(JSON.parse(data).message[0].when).to.equal('2017-05-19T23:33:45.000Z');
        testLastSingleTakenMedicine();
    })
}

function testTuliReportsTakenMedicine2() {
    putOrPostToServer(userTokens[tuliEmail], 'PUT', '/takenmedicine', {
        when: '2016-01-01T12:00:00Z', medicine_id: 'x777', dosage: 3
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testAllLatestTakenMedicine();
    });
}

function testTuliReportsTakenMedicine1() {
    putOrPostToServer(userTokens[tuliEmail], 'PUT', '/takenmedicine', {
        when: '2017-05-19T23:33:45Z', medicine_id: 'x123', dosage: 1.2
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliReportsTakenMedicine2();
    });
}

function testTuliHasMedicine() {
    getFromServer(userTokens[tuliEmail], '/user/' + userIds['tuli'], function (data) {
        console.log(data);
        expect(JSON.parse(data).message.medical_info.medication.length).to.equal(1);
        // console.log(omitDeep(JSON.parse(data).message.medical_info, '_id'));
        expect(_.isEqual(
            omitDeep(JSON.parse(data).message.medical_info, '_id'),
            _.merge(medicalData, { medication: _.forEach(medicalData.medication, function (med) {
                return _.merge(med, { last_taken: null });
            }) })
        )).to.be.true;
        testTuliReportsTakenMedicine1();
    })
}

function testTweenyCanAddMedicineToTuli() {
    putOrPostToServer(userTokens[tweenyEmail], 'POST', '/user/' + userIds['tuli'], { medical_info: medicalData}, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testTuliHasMedicine();
    });
}

function testAdminCanAddImageToMedicine() {
    putOrPostToServer(adminToken, 'POST', '/medicine/x123', {
        images: ['image555']
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testTweenyCanAddMedicineToTuli();
    });
}

function testAdminCanCreateNewImage() {
    putOrPostToServer(adminToken, 'PUT', '/image', {
        image_id: 'image555',
        format: 'png',
        contents: 'iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAMAAAAM7l6QAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACcFBMVEUAAACXJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB+XJB/////0TRaIAAAAznRSTlMAAAYoRFBKMw894vf7+fJ+ZK4EBQIBIarcQgUABQESlIw9adr+7pQ3bao3AoL98vj98PzAGDvq/nsDnP3SiWd4uPbZICHe/JwcCmfs/V0PlPi3EgF2/cUvCIf/+VQc18MgXP7mJwSupwJe/uQkA6qpAgFz/vZHFM62EQh07aQJYPn7px4k4fd9DAJI3v1hB6z4tGJCUZTq4ypL8/33+/+PAgea/P3/+//TJR+0sWCM7vq1WpTLTRAJBT2/5mIQAxMDarQGR/ONDEZpd3BWHo3mDFUAAAABYktHRM+D3sJpAAAAB3RJTUUH4QQdEwoufmazaQAAAYVJREFUKM9jYKAPYGRiZmFlY+dgZMQuzcnFzcPLx49LWuAcCAgKoUszMgqLMIqKiYOlJSSlGKVlZJHUMMrJKygqKauApc+pqqlraGohrGDU1tE9p6d/DgYMDI3OGZswwo02NTuHDswtYNoZLa0gQtY2tnb2Do4QjpMzTNrFFSzg5u7ByMjo6eUN5vn4wqT9/ANAAoFBIAHG4JBQEC8sHG55RGTUuXPRMRDbGGPjgLLxCUhOT0w6dy45BcJnTE0DSqdnIDzOmJl17lx2DlQ6Nw8onV+A0FxYVHzuXEkp1PCycqB0RSXcY1XVNSDH1NaBncZY3wDkNDY1w6RbWsFeaWvvAHqss6sbzOvphUn39UNCYsLESZOnTJ0G4UyfAZNmnDkLGpSz58ydB2XOXwD398JF584tXgIP76XLlp9bsRLhcsZVq9esXbceKrth46bNW7YipRlGxm3bGXfs3AWW3b1nL+O+/Qcwk8xBsPShwzjS2pGjIOljuJLi8RMnT50+cxaHNPUBAKaI25/rA/PEAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA0LTI5VDE5OjEwOjQ2KzAyOjAwaQg1YQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wNC0yOVQxOToxMDo0NiswMjowMBhVjd0AAAAASUVORK5CYII='
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testAdminCanAddImageToMedicine();
    });
}

function testAdminCanCreateNewMedicine() {
    console.log('------In testAdminCanCreateNewMedicine-----------');
    putOrPostToServer(adminToken, 'PUT', '/medicine', {
        medicine_id: "x123",
        route_of_administration: "oral",
        dosage_form: "tablets"
    }, function (data) {
        console.log(data);
        expect(JSON.parse(data).error).to.be.false;
        testAdminCanCreateNewImage();
    });
}

function testAdminCanGetAllUsers() {
    getFromServer(adminToken, '/user', function (data) {
        console.log(data);
        expect(_.isEqual(
            [tuliEmail, tweenyEmail].sort(),
            _.map(JSON.parse(data).message, 'email').sort()
            )
        ).to.be.true;
        testAdminCanCreateNewMedicine();
    })
}

function testTuliHasCaretakerTweeny() {
    getFromServer(userTokens[tweenyEmail], '/caretakers/' + userIds['tuli'], function (data) {
       console.log(data);
       var caretakers = JSON.parse(data).message;
       expect(caretakers.length).to.equal(1);
       expect(_.isEqual(caretakers[0], { userid: userIds['tweeny'], 'name': tweenyName, 'email': tweenyEmail })).to.be.true;
       testAdminCanGetAllUsers();
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
