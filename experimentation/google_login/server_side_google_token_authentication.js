/**
 * Created by noa on 5/27/17.
 */
var GLOOLA_SERVER_CLIENT_ID = '798358484692-gr8595jlvqtslqte1gjg3bf8fb1clgg3.apps.googleusercontent.com';
var token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ3MWJjZmJmMDY2ZmFlNWNkNTVkNmYyZmVjZWEyMDlhZjQ3YTQ0MDcifQ.eyJhenAiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI3OTgzNTg0ODQ2OTItZ3I4NTk1amx2cXRzbHF0ZTFnamczYmY4ZmIxY2xnZzMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDcxNDc3Njk3MDYzODk1ODA4NjEiLCJlbWFpbCI6InR3ZWVueWhhc2xlZnR0aGVidWlsZGluZ0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IkVUVlFTUlJNeGFhdzF5NWFxYkljX0EiLCJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiaWF0IjoxNDk2NTcwMjIyLCJleHAiOjE0OTY1NzM4MjIsIm5hbWUiOiJUd2VlbnkgUGVsZWQiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDYuZ29vZ2xldXNlcmNvbnRlbnQuY29tLy1QOXloYXFFeVJlUS9BQUFBQUFBQUFBSS9BQUFBQUFBQUFBQS9BQXlZQkY3bVZ1YThNNEJ4WklNTU9WR1IxQlVkYTFJQWZ3L3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJUd2VlbnkiLCJmYW1pbHlfbmFtZSI6IlBlbGVkIiwibG9jYWxlIjoiZW4ifQ.APBgGjfBYjPjR9x6jfWRHmM-v5mD5V4YZvExDfTcD_O0uz4TTz0B8kfT4g8ACpcRUusHubclFXNQ4KG-D-UQhvwtoX1yS8LESe2v6ZSmfn_h9xVaqJ9ZhZ9gHiR5bESM7edXmL5BgztvVevIgw0BlFxeuZ5LnkrO-8gEpolBbdrJ9M-AhJMOJoL1gCTGI1lR4CLFp5U8fRSWMfzEpF9tgrFYE3VlQauCJRo7F60yjUwJdWQCsOI8j2bCJMDK5UztnTsjRShyq-RlEgyZzW8E8PaZ8pZZ_Z0pYC1jakHhdxxAZbi9decyryCg9dtEG9rFhbz9yeE4OjbMTFd-LMWZyg';

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
            if (!payload.email_verified) {
                // Error
            }
            console.log(payload);
            var email = payload['email'];
            console.log(email);
        }
        // If request specified a G Suite domain:
        //var domain = payload['hd'];
    });
