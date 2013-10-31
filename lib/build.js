/*jshint node: true */

var fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    css = require('./css'),
    js = require('./js'),
    lint = require('./lint');

module.exports = build;

function build(options, callback) {
    var exampleDir = path.join(process.cwd(), 'example'),
        outputDir = path.join(process.cwd(), 'build'),
        jsOpts = { debug: options.debug };

    lint(options, linted);

    function linted(err) {
        if (err) {
            return callback(err);
        }

        mkdirp(outputDir, createdDir);
    }

    function createdDir(err) {
        if (err) {
            return callback(err);
        }

        buildFiles(callback);
    }
}

function buildFiles(callback) {
    var counter = 3;

    make('example.js', function(input) { return js(input, jsOpts); });
    make('example.css', css);
    make('index.html', fs.createReadStream);

    function make(name, process) {
        var input = path.join(exampleDir, name),
            output = path.join(outputDir, name);

        fs.exists(input, checked);

        function checked(exists) {
            if (!exists) {
                return done();
            }

            pipe(process(input), fs.createWriteStream(output), done);
        }
    }

    var error;
    function done(err) {
        if (err && !error) {
            error = err;
        }

        if (--counter === 0) {
            callback(error);
        }
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
