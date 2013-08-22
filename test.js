/*jshint node: true */

var test = require('tap').test,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    path = require('path'),
    request = require('request');

var fixtures = path.join(__dirname, 'tests', 'fixtures'),
    dist = path.join(fixtures, 'dist'),
    expected = path.join(__dirname, 'tests', 'expected');

function run(command, callback) {
    var cmd = 'node',
        args = ['../../bin/hut-build', command],
        options = { cwd: fixtures },
        proc = spawn(cmd, args, options);
    if (callback) {
        proc.on('exit', callback);
    }

    return proc;
}

test('build dist files', function(t) {
    run('build', complete);

    function complete(exitCode) {
        t.equal(exitCode, 0);

        var files = fs.readdirSync(expected);
        files.forEach(function(file) {
            var expectedFile = path.join(expected, file),
                expectedSrc = fs.readFileSync(expectedFile, 'utf8'),
                distFile = path.join(dist, file),
                distSrc = fs.readFileSync(distFile, 'utf8');

            // Normalize line endings
            expectedSrc = expectedSrc.replace(/\r?\n/g, '\n');
            distSrc = distSrc.replace(/\r?\n/g, '\n');

            t.equal(expectedSrc, distSrc, 'File ' + file + ' should be built');
        });

        t.end();
    }
});

test('serve files', function(t) {
    var proc = run('serve'),
        tryCount = 0;

    start();

    // Wait for the server to start
    function start() {
        request('http://localhost:8000/', requestedIndex);
    }

    function requestedIndex(err, resp, body) {
        if (err) {
            // Try for a max of 4 seconds
            if (tryCount++ > 20) {
                t.ok(false, 'Could not connect to server');
                return t.end();
            }

            // Retry until the server is started
            setTimeout(start, 200);
            return;
        }

        t.notOk(err);
        t.equal(resp.statusCode, 200);
        t.ok(/^<!DOCTYPE html>/.test(body));

        request('http://localhost:8000/script.js', requestedScript);
    }

    function requestedScript(err, resp) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);
        request('http://localhost:8000/style.css', requestedStyle);
    }

    function requestedStyle(err, resp) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);
        done();
    }

    function done() {
        proc.kill();
        t.end();
    }
});