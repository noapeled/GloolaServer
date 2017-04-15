/**
 * Created by noa on 15/04/17.
 */

var removeAllDocuments = function(db, callback) {
    db.collection('documents').remove({}, function(err, result) {
        assert.equal(err, null);
        // assert.equal(1, result.result.n);
        console.log("Removed all documents");
        callback(result);
    });
};

var findDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.find({}).toArray(function(err, docs) {
        assert.equal(err, null);
        // assert.equal(2, docs.length);
        console.log("Found the following " + docs.length + " records");
        console.dir(docs);
        callback(docs);
    });
};

var updateDocument = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.update({ a : 2 }
        , { $set: { b : 1 } }, function(err, result) {
            assert.equal(err, null);
            assert.equal(1, result.result.n);
            console.log("Updated the document with the field a equal to 2");
            callback(result);
        });
};

var insertDocuments = function(db, callback) {
    // Get the documents collection
    var collection = db.collection('documents');
    // Insert some documents
    collection.insert([
        {a : 1}, {a : 2}, {a : 3}
    ], function(err, result) {
        assert.equal(err, null);
        assert.equal(3, result.result.n);
        assert.equal(3, result.ops.length);
        console.log("Inserted 3 document into the document collection");
        callback(result);
    });
};

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connection URL
var url = 'mongodb://localhost:27017/myproject';

// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    removeAllDocuments(db, function() {});

    insertDocuments(db, function() {
        updateDocument(db, function() {
            findDocuments(db, function() {
                db.close();
            });
        });
    });

});
