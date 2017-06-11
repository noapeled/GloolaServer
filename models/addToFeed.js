function addToFeed(mongoose, feedEventBody) {
    (new mongoose.models.FeedEvent(feedEventBody)).save(function(err) {
        if (err) {
            console.log('Error: failed to add event to feed: ' + JSON.stringify(feedEventBody) + ' -- error is ' + JSON.stringify(err));
        }
    })
}

exports.addToFeed = addToFeed;

