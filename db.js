/**
 * Created by noa on 16/04/17.
 */
// Bring Mongoose into the app
var mongoose = require( 'mongoose' );

// BRING IN YOUR SCHEMAS & MODELS
require('./models/takenmedicine');
require('./models/image');
require('./models/medicine');
require('./models/user');

function connectToDatabase(dbName) {
    // Build the connection string
    var dbURI = 'mongodb://localhost/' + dbName;

    // Create the database connection
    mongoose.connect(dbURI);

    // CONNECTION EVENTS
    // When successfully connected
    mongoose.connection.on('connected', function () {
        console.log('Mongoose default connection open to ' + dbURI);
    });

    // If the connection throws an error
    mongoose.connection.on('error', function (err) {
        console.log('Mongoose default connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose default connection disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });
}
exports.connectToDatabase = connectToDatabase;
