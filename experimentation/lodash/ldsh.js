/**
 * Created by inon on 6/4/17.
 */

var _ = require('lodash');

var m = [
    { a: ['hello', 'world', 'meow'], b: 7, c: 8},
    { a: ['brick', 'road', 'yellow'], b: 9, c: 10},
];

var r = new RegExp("l", "i");

var v = _.map(m, function (obj) {return {
    a: _.filter(obj.a, function (name) { return r.test(name); }),
    c: obj.c
}});

console.log(v);