/*jshint node: true */

var fs = require('fs'),
    path = require('path'),
    async = require('async'),
    mkdirp = require('mkdirp'),
    css = require('./css'),
    js = require('./js'),
    lint = require('./lint');

module.exports = build;

function build(options, callback) {
    var exampleDir = path.join(process.cwd(), 'example'),
        outputDir = path.join(process.cwd(), 'build'),
        jsOpts = { debug: options.debug };

    async.series([
        runLint,
        createDir,
        writeFiles
    ], callback);

    function runLint(callback) {
        lint(options, callback);
    }

    function createDir(callback) {
        mkdirp(outputDir, callback);
    }

    function writeFiles(callback) {
        async.parallel([
            writeBuild('example.js', jsOpts, js),
            writeBuild('example.css', null, css),
            writeBuild('index.html', null, fs.createReadStream)
        ], callback);
    }

    function writeBuild(file, options, source) {
        var input = path.join(exampleDir, file),
            output = path.join(outputDir, file);

        function build(callback) {
            pipe(
                source(input, options),
                fs.createWriteStream(output),
                callback);
        }

        return function(callback) {
            fs.exists(input, function(exists) {
                // Skip file if it doesn't exist
                if (!exists) {
                    return callback();
                }

                build(callback);
            });
        };
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
