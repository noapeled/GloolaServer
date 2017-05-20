/**
 * Created by inon on 5/20/17.
 */

'use strict';

require('./server');

var http = require('http');
var expect = require('chai').expect;

// An object of options to indicate where to post to
var post_options = {
    path: '/authenticate',
    host: 'localhost',
    port: '3000',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

var post_req = http.request(post_options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        expect(JSON.parse(chunk).error).to.be.false;
    });
});

// Build the post string from an object
// var post_data = querystring.stringify({
//     'compilation_level' : 'ADVANCED_OPTIMIZATIONS',
//     'output_format': 'json',
//     'output_info': 'compiled_code',
//     'warning_level' : 'QUIET',
//     'js_code' : codestring
// });

// post the data
post_req.write(JSON.stringify({ userid: 'admin', password: 'gloola123!'}));
post_req.end();
