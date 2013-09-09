/*jshint node: true */

var fs = require('fs'),
    path = require('path'),
    through = require('through'),
    rework = require('rework'),
    reworkNpm = require('rework-npm'),
    reworkVars = require('rework-vars');

module.exports = css;

function css(file) {
    var stream = through();

    fs.readFile(file, 'utf8', readFile);

    function readFile(err, src) {
        if (err) {
            return error(err);
        }

        try {
            src = rework(src)
                .use(reworkNpm(path.dirname(file)))
                .use(reworkVars())
                .toString();
        } catch (e) {
            return error(e);
        }

        stream.queue(new Buffer(src));
        stream.end();
    }

    function error(err) {
        stream.emit('error', err);
        stream.end();
    }

    return stream;
}