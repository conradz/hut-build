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
            buildJs(dir),
            buildCss(dir),
            copyIndex(dir)
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

function buildJs(dir) {
    var input = path.join(dir, 'example', 'example.js'),
        output = path.join(dir, 'example', 'build', 'example.js');
    return function(callback) {
        pipe(
            js(input),
            fs.createWriteStream(output),
            callback);
    };
}

function buildCss(dir) {
    var input = path.join(dir, 'example', 'example.css'),
        output = path.join(dir, 'example', 'build', 'example.css');
    return function(callback) {
        pipe(
            css(input),
            fs.createWriteStream(output),
            callback);
    };
}

function copyIndex(dir) {
    var input = path.join(dir, 'example', 'index.html'),
        output = path.join(dir, 'example', 'build', 'index.html');
    return function(callback) {
        pipe(
            fs.createReadStream(input),
            fs.createWriteStream(output),
            callback);
    };
}