/**
 * Created by inon on 5/20/17.
 */

var testDbName = 'temporaryTestDb';

require('./server').serverMain(testDbName);

var http = require('http');
var expect = require('chai').expect;

adminToken = null;
userIds = { };
userTokens = { };

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

function allTestsDone(data) {
    console.log(data);
}

function setTweenyAsCaretakerOfTuli() {
    console.log(userTokens);
    console.log(userIds);
    putOrPostToServer(userTokens['tweeny@t.com'], 'POST', '/user/' + userIds['tweeny'], {
        patients: [userIds['tuli']]
    }, allTestsDone)
}

function loginAsTweeny() {
    console.log(userIds);
    getUserToken('tweeny@t.com', 'ttt', setTweenyAsCaretakerOfTuli);
}

function createUserTuli() {
    createNewUserAsAdmin(['Tuli', 'Peled'], 'tuli@t.com', 'lll', loginAsTweeny);
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

function getUserToken(email, password, continueCallback) {
    putOrPostToServer(
        '',
        'POST',
        '/authenticate',
        {email: email, password: password},
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

function getAdminToken() {
    putOrPostToServer(
        '',
        'POST',
        '/authenticate',
        {userid: 'admin', password: 'gloola123!'},
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

function createUserTweeny() {
    createNewUserAsAdmin(['Tweeny', 'Peled'], 'tweeny@t.com', 'ttt', createUserTuli);
}

function continueNowThatAdminTokenIsKnown() {
    require('mongoose').connection.dropDatabase(testDbName);
    createUserTweeny();
}

getAdminToken();
