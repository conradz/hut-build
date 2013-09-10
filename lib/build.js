/*jshint node: true */

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    css = require('./css'),
    js = require('./js');

module.exports = build;

function build(dir, callback) {
    var example = path.join(dir, 'example'),
        output = path.join(example, 'build');

    mkdirp(output, createdDir);

    function createdDir(err) {
        if (err) {
            return callback(err);
        }

        async.parallel([
            writeBuild(dir, 'example.js', js),
            writeBuild(dir, 'example.css', css),
            writeBuild(dir, 'index.html', fs.createReadStream)
        ], callback);
    }
}

function pipe(input, output, callback) {
    var isDone = false;

    function error(err) {
        if (!isDone) {
            isDone = true;
            output.end();
            callback(err);
        }
    }

    function done() {
        if (!isDone) {
            isDone = true;
            output.end();
            callback();
        }
    }

    input.on('error', error);
    output.on('error', error);
    output.on('finish', done);

    input.pipe(output);
}

function writeBuild(dir, file, action) {
    var input = path.join(dir, 'example', file),
        output = path.join(dir, 'example', 'build', file);

    function build(callback) {
        pipe(
            action(input),
            fs.createWriteStream(output),
            callback);
    }

    return function(callback) {
        fs.exists(input, function(exists) {
            if (!exists) {
                return callback();
            }

            build(callback);
        });
    };
}