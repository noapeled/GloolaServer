var FCM = require('fcm-node');
var serverKey = 'AAAAC_-M5RQ:APA91bFGcMxQyiFfy0BTPAPk-hLUU1IptF9Vy_NvFXcrebF2f0CC876IHEU0O6cpxjgnKe8ooz2SZIRCIsFmsAyTZHtTyfbfRQ2aljZaSdVRtYJHy3lzBGijVqkr5SmW1HXxV3EMnVe3'; //put your server key here
var fcm = new FCM(serverKey);

var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
    to: 'fDaKQTvm9O0:APA91bEiBzgKY-urO49BN792an49mHF2mfAy2KVOqNEV_7DF184442lQ4Dtlt6INPyD0_LMVSEsQDKDAxyjZ98_uyClQe5x3FPHmhncLfL4h-FVb2xcCZRXqPG8DDDLVas4JwCQKfYoR',
    collapse_key: 'do_not_collapse',

    notification: {
        title: 'Title of your push notification',
        body: 'Body of your push notification'
    }

    // data: {  //you can send only notification or only data(or include both)
    //     my_key: 'my value',
    //     my_another_key: 'my another value'
    // }
};

fcm.send(message, function(err, response){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
});
