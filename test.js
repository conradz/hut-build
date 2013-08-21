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
    var proc = run('serve');

    // Wait for the server to start
    setTimeout(function() {
        request('http://localhost:8000/', requestedIndex);
    }, 1000);

    function requestedIndex(err, resp, body) {
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