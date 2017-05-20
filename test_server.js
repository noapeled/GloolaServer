/**
 * Created by inon on 5/20/17.
 */

'use strict';

var testDbName = 'temporaryTestDb';

require('./server').serverMain(testDbName);
// TODO: eventually delete test database through mongo.

var http = require('http');
var expect = require('chai').expect;

function postToServer(path, postBody, callbackOnResponseData) {
    var postOptions = {
        path: path,
        host: 'localhost',
        port: '3000',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    var postReq = http.request(postOptions, function(res) {
        res.setEncoding('utf8');
        res.on('data', callbackOnResponseData);
    });

    // post the data
    postReq.write(JSON.stringify(postBody));
    postReq.end();
}

function createNewUser(name, email, password) {

}

postToServer(
    '/authenticate',
    { userid: 'admin', password: 'gloola123!'},
    function (chunk) {
        var jsonBody = JSON.parse(chunk);
        console.log(jsonBody);
        expect(jsonBody.error).to.be.false;
        expect(jsonBody.message).to.be.defined;
        expect(jsonBody.token).to.be.defined;
    }
);
