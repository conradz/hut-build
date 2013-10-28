/*jshint node: true */

// These tests take a *long* time to run since they run multiple test runs
// against many browsers using Sauce Labs

var test = require('tap').test,
    bin = require.resolve('./bin/hut-build'),
    fs = require('fs'),
    path = require('path'),
    request = require('request'),
    async = require('async'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn;

var testsDir = path.join(__dirname, 'tests'),
    testTime = Infinity,
    expected = getExpected();

function getExpected() {
    var dir = path.join(testsDir, 'expected'),
        files = {};
    fs.readdirSync(dir).forEach(function(file) {
        files[file] = normalize(fs.readFileSync(path.join(dir, file), 'utf8'));
    });

    return files;
}

function normalize(src) {
    return src.replace(/\r?\n/g, '\n');
}

test('lint example files', function(t) {
    var dir = path.join(testsDir, 'example');
    exec(bin + ' lint', { cwd: dir }, done);

    function done(err) {
        t.notOk(err, 'Source files should pass lint');
        t.end();
    }
});

test('return error when linting failed', function(t) {
    var dir = path.join(testsDir, 'lint');
    exec(bin + ' lint', { cwd: dir }, done);

    function done(err) {
        t.ok(err, 'Returned error code when files did not pass lint');
        t.end();
    }
});

test('build example files', function(t) {
    var dir = path.join(testsDir, 'example');
    exec(bin + ' build', { cwd: dir }, built);

    function built(err) {
        t.error(err, 'built successfully');

        for (var file in expected) {
            var expectedSrc = expected[file],
                result = normalize(fs.readFileSync(path.join(dir, 'build', file), 'utf8'));
            t.equal(expectedSrc, result, 'built file ' + file);
        }

        t.end();
    }
});

test('run lint when building', function(t) {
    var dir = path.join(testsDir, 'lint');
    exec(bin + ' build', { cwd: dir }, done);

    function done(err) {
        t.ok(err, 'build returned error when lint failed');
        t.end();
    }
});

test('serve files', function(t) {
    var dir = path.join(testsDir, 'example'),
        server = spawn(bin, ['serve'], { cwd: dir }),
        completed = false;

    server.on('exit', exited);
    setTimeout(started, 1000);

    function started() {
        async.eachSeries(Object.keys(expected), verify, done);
    }

    function verify(file, callback) {
        var url = 'http://localhost:8000/' + file,
            expectedSrc = expected[file];

        request(url, function(err, resp, body) {
            if (err) {
                return callback(err);
            }

            t.equal(resp.statusCode, 200, 'status code ok');

            // The HTML files have injected code in them, so skip verifying the
            // contents
            if (file !== 'index.html') {
                t.equal(normalize(body), expectedSrc, 'serve file ' + file);
            }
            callback();
        });
    }

    function done(err) {
        completed = true;
        t.error(err, 'requested all files');
        server.kill();
    }

    function exited(code) {
        t.ok(completed, 'did not exit prematurely');
        t.end();
    }
});

test('serve tests', function(t) {
    var dir = path.join(testsDir, 'example'),
        server = spawn(bin, ['serve'], { cwd: dir }),
        complete = false;

    setTimeout(started, 1000);
    server.on('exit', exited);

    function started() {
        async.series([
            testRedirect,
            testPage,
            testScript
        ], done);
    }

    function testRedirect(callback) {
        request({
            url: 'http://localhost:8000/test',
            method: 'GET',
            followRedirect: false
        }, done);

        function done(err, resp) {
            t.error(err, 'requested /test');
            t.equal(resp.statusCode, 302);
            t.equal(resp.headers['location'], '/test/');
            callback();
        }
    }

    function testPage(callback) {
        request('http://localhost:8000/test/', done);

        function done(err, resp) {
            t.error(err, 'requested /test/');
            t.equal(resp.statusCode, 200);
            callback();
        }
    }

    function testScript(callback) {
        request('http://localhost:8000/test/script.js', done);

        function done(err, resp) {
            t.error(err, 'requested /test/script.js');
            t.equal(resp.statusCode, 200);
            callback();
        }
    }

    function done(err) {
        t.error(err, 'requested files');
        complete = true;
        server.kill();
    }

    function exited() {
        t.ok(complete, 'did not exit prematurely');
        t.end();
    }
});

// This takes a long time since it connects to Sauce Labs
test('test example files', { timeout: testTime }, function(t) {
    var dir = path.join(testsDir, 'example');
    exec(bin + ' test', { cwd: dir }, done);

    function done(err) {
        t.error(err, 'successfully tested example');
        t.end();
    }
});

test('run lint when testing', function(t) {
    var dir = path.join(testsDir, 'lint');
    exec(bin + ' test', { cwd: dir }, done);

    function done(err) {
        t.ok(err, 'test returned error when lint fails');
        t.end();
    }
});

test('return error when tests fail', { timeout: testTime }, function(t) {
    var dir = path.join(testsDir, 'fail');
    exec(bin + ' test', { cwd: dir }, done);

    function done(err) {
        t.ok(err, 'test returned error when tests failed');
        t.end();
    }
});
