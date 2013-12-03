'use strict';
/*jshint node: true */

var path = require('path'),
    http = require('http'),
    gaze = require('gaze'),
    router = require('routes-router'),
    redirect = require('redirecter'),
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

    var app = router();
    app.addRoute(/^\/test$/, function(req, resp) {
        redirect(req, resp, '/test/');
    });
    app.addRoute('/test/*?', function(req, resp, opts) {
        req.url = '/' + (opts.splats[0] || '');
        testScript(req, resp);
    });
    app.addRoute('*', files);

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
