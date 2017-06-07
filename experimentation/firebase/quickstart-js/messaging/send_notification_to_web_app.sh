#!/bin/sh

while [ 1 ] ; do
	curl -X POST \
		-H "Authorization: key=AAAAC_-M5RQ:APA91bFGcMxQyiFfy0BTPAPk-hLUU1IptF9Vy_NvFXcrebF2f0CC876IHEU0O6cpxjgnKe8ooz2SZIRCIsFmsAyTZHtTyfbfRQ2aljZaSdVRtYJHy3lzBGijVqkr5SmW1HXxV3EMnVe3" \
		-H "Content-Type: application/json" \
		-d "{ \"notification\": { \"body\": \"This is a notification sent at time `date`\"}, \
  			\"to\": \"$1\"\
		}"  \
		"https://fcm.googleapis.com/fcm/send"
done
