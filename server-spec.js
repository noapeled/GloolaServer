/**
 * Created by inon on 5/20/17.
 */

'use strict';

require('./server');

var http = require('http');
var expect = require('chai').expect;

function postToServer(path, jsonBody, callbackOnResponseData) {
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
    postReq.write(JSON.stringify(jsonBody));
    postReq.end();
}

postToServer(
    '/authenticate',
    { userid: 'admin', password: 'gloola123!'},
    function (chunk) {
        var jsonBody = JSON.parse(chunk);
        expect(jsonBody.error).to.be.false;
        expect(jsonBody.message).to.be.defined;
        expect(jsonBody.token).to.be.defined;
    }
);
