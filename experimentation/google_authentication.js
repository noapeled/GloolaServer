/**
 * Created by noa on 5/27/17.
 */
var GLOOLA_SERVER_CLIENT_ID = '798358484692-gr8595jlvqtslqte1gjg3bf8fb1clgg3.apps.googleusercontent.com';
var token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ3MWJjZmJmMDY2ZmFlNWNkNTVkNmYyZmVjZWEyMDlhZjQ3YTQ0MDcifQ.' +
    'eyJhenAiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20' +
    'iLCJhdWQiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20' +
    'iLCJzdWIiOiIxMDMzOTk1NDk5NDk3NzcyNDM5NjQiLCJlbWFpbCI6Imlub24ucGVsZWRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOn' +
    'RydWUsImF0X2hhc2giOiJHcUdIX0d3N0FGTFhCRnJfNDdNWEVnIiwiaXNzIjoiYWNjb3VudHMuZ29vZ2xlLmNvbSIsImlhdCI6MTQ5NjU2NjYxMS' +
    'wiZXhwIjoxNDk2NTcwMjExLCJuYW1lIjoiSW5vbiBQZWxlZCIsInBpY3R1cmUiOiJodHRwczovL2xoNS5nb29nbGV1c2VyY29udGVudC5jb' +
    '20vLUJYaHdmWXNtc0xVL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FBeVlCRjdNUWxPMFFUUVg0MlN4cnUtTm1XZ1h3S0xEaHcvczk2LWMvc' +
    'GhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6Iklub24iLCJmYW1pbHlfbmFtZSI6IlBlbGVkIiwibG9jYWxlIjoiZW4ifQ.Zk5O5X8fzR9xpVqkZoUM' +
    '1sqXNyRHE2844nJcGViVsjztsAofC_uumZtsOtisPBKX5aFs3muG2qvabnrUKJA6v4ry409b3T8Z-rMGCyNQ2QjwtL1duO8sxTHXM02q_FcZ' +
    'abdbUrlXYa9YYPA12LwqF8eJjHj39pKGF_8dkuSrW44AgB5Ffuv16H95BtknmdRO3SL7qECaf05t7ZDfZVfscIL3OHagIGt-' + '' +
    'iA7S4jh642W1auvfmo0gKy8sRpNWO-xgTdUnHi2C3NEKlZ_dR4LzA1MLWKHohUGwOdY_hxknxREpaTqQbky5AN2YdYbWAmy2DDQDuoRAMX' +
    'dzTsviDnzNtA';

var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2(GLOOLA_SERVER_CLIENT_ID, '', '');
client.verifyIdToken(
    token,
    GLOOLA_SERVER_CLIENT_ID,
    function(e, login) {
        if (e) {
            console.log('Meh');
            console.log(e);
        } else {
            var payload = login.getPayload();
            console.log(payload);
            var userid = payload['sub'];
        }
        // If request specified a G Suite domain:
        //var domain = payload['hd'];
    });
