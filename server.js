/**
 * Created by noa on 15/04/17.
 */
var db = require('./models/db');

var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
// var router      =   require('./router').router;

var router      =   express.Router();
var mongoose    = require('mongoose');

//route() will allow you to use same path for different HTTP operation.
//So if you have same URL but with different HTTP OP such as POST,GET etc
//Then use route() to remove redundant code.

router.route("/users")
    .get(function(req, res){
        mongoose.models.User.find({ }, function(err, data) {
            res.json({
                "error" : !!err,
                "message" : err ? "Error fetching data" : data
            });
        });
    });

// exports.router = router;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));
app.use('/', router);
app.listen(3000);
console.log("Listening to PORT 3000");
