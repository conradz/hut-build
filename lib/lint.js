/*jshint node: true */

var path = require('path'),
    jshint = require('build-jshint'),
    jshintOpts = require('../jshint.json'),
    config = require('./config');

module.exports = lint;

function lint(callback) {
    var dir = process.cwd(),
        files = config.js.map(function(f) { return path.join(dir, f); });

    jshint(files, jshintOpts, done);

    function done(err, failed) {
        if (!err && failed) {
            err = new Error('JSHint failed');
        }

        callback(err);
    }
}
