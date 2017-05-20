/**
 * Created by inon on 5/20/17.
 */

var testDbName = 'temporaryTestDb';

require('./server').serverMain(testDbName);

var http = require('http');
var expect = require('chai').expect;

adminToken = '';

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

function createNewUserAsAdmin(name, email, password) {
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
        }
    )
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

function continueNowThatAdminTokenIsKnown() {
    require('mongoose').connection.dropDatabase(testDbName);
    createNewUserAsAdmin(['Tweeny', 'Peled'], 'tweeny@t.com', 'ttt');
}

getAdminToken();
