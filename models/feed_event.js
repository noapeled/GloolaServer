var data_types = require('./data_types');
var mongoose = require('mongoose');

var FeedEvent = data_types.createSchema({
    medicine_names: [String],
    userid: { type: String, required: true },
    when: { type: Date, required: true, nullable: false },
    scheduled_medicine_id: { type: String, required: true },
    event: { type: mongoose.SchemaTypes.Mixed, required: true }
});

module.exports = mongoose.model('FeedEvent', FeedEvent, 'FeedEvent');
