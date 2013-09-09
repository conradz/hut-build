/*jshint node: true */

var test = require('tap').test,
    build = require('./'),
    fs = require('fs'),
    path = require('path'),
    request = require('request');

var fixtures = path.join(__dirname, 'tests', 'fixtures'),
    buildDir = path.join(fixtures, 'example', 'build'),
    expected = getExpected();

function getExpected() {
    var dir = path.join(__dirname, 'tests', 'expected'),
        files = {};
    fs.readdirSync(dir).forEach(function(file) {
        files[file] = normalize(fs.readFileSync(path.join(dir, file), 'utf8'));
    });

    return files;
}

function normalize(src) {
    return src.replace(/\r?\n/g, '\n');
}

test('lint source files', function(t) {
    build.lint(__dirname, linted);

    function linted(err) {
        t.notOk(err, 'Source files should pass lint');
        t.end();
    }
});

test('lint files', function(t) {
    build.lint(fixtures, linted);

    function linted(err) {
        t.notOk(err);
        t.end();
    }
});

test('build dist files', function(t) {
    build.build(fixtures, complete);

    function complete(err) {
        t.notOk(err);

        Object.keys(expected).forEach(function(file) {
            var built = fs.readFileSync(path.join(buildDir, file), 'utf8');
            built = normalize(built);

            t.equal(expected[file], built,
                'File ' + file + ' should be built');
        });

        t.end();
    }
});

test('serve files', function(t) {
    build.serve(fixtures, { port: 0 }, serving);

    var server,
        url;

    function serving(err, s) {
        t.notOk(err);
        server = s;
        url = 'http://localhost:' + s.address().port;

        request(url + '/example/', requestedIndex);
    }

    function requestedIndex(err, resp, body) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);
        t.equal(expected['index.html'], normalize(body));

        request(url + '/example/example.js', requestedScript);
    }

    function requestedScript(err, resp, body) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);
        t.equal(expected['example.js'], normalize(body));

        request(url + '/example/example.css', requestedStyle);
    }

    function requestedStyle(err, resp, body) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);
        t.equal(expected['example.css'], normalize(body));

        request(url + '/test/', requestedTest);
    }

    function requestedTest(err, resp) {
        t.notOk(err);
        t.equal(resp.statusCode, 200);

        server.close(done);
    }

    function done() {
        t.end();
    }
});