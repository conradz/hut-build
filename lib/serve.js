'use strict';
/*jshint node: true */

var path = require('path'),
    http = require('http'),
    gaze = require('gaze'),
    st = require('st'),
    serveScript = require('serve-script'),
    build = require('./build'),
    js = require('./js');

module.exports = serve;

var TEST_PATH = /^\/test\//;

function serve(options, callback) {
    var buildDir = path.join(process.cwd(), 'build'),
        port = options.port || 8000,
        testScript = serveScript({ src: getTest }),
        files = st({
            path: buildDir,
            index: 'index.html',
            cache: false
        });

    function app(req, resp) {
        if (req.url === '/test') {
            resp.writeHeader(302, {
                'Content-Length': 0,
                'Location': '/test/'
            });
            resp.end();
        } else if (TEST_PATH.test(req.url)) {
            req.url = '/' + req.url.replace(TEST_PATH, '');
            testScript(req, resp);
        } else {
            files(req, resp);
        }
    }

    http.createServer(app)
        .listen(port, started);

    function started(err) {
        if (err) {
            return callback(err);
        }

        console.log('Serving on port', port);
        runBuild(options, built);
    }

    function built(err) {
        if (err) {
            return callback(err);
        }

        gaze([
             'example/**/*',
             'lib/**/*',
             'styles/**/*',
             'bin/**/*',
             '*.js',
             '*.css',
             '*.html'
        ], watched);
    }

    function watched(err, watcher) {
        if (err) {
            return callback(err);
        }

        watcher.on('all', function() { runBuild(options); });
    }

    // Callback is never called on success, since the server will keep running
    // until terminated
}

function runBuild(options, callback) {
    build(options, function(err) {
        if (err) {
            console.error('Build failed');
            console.error(err);
        }

        if (callback) {
            callback();
        }
    });
}

function getTest(callback) {
    callback(null, js(path.join(process.cwd(), 'test.js')));
}
