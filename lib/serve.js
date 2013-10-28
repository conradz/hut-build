/*jshint node: true */

var path = require('path'),
    async = require('async'),
    connect = require('connect'),
    instant = require('instant'),
    gaze = require('gaze'),
    serveScript = require('serve-script'),
    build = require('./build'),
    js = require('./js');

module.exports = serve;

function serve(callback) {
    var buildDir = path.join(process.cwd(), 'build'),
        port = 8000;
    var app = connect()
        .use(instant(buildDir))
        .use(redirectTest)
        .use('/test/', serveScript({ src: getTest }));

    async.series([
        startServer,
        runBuild,
        watch
    ], done);

    function startServer(callback) {
        app.listen(port, started);

        function started(err) {
            if (err) {
                return callback();
            }

            console.log('Serving on port', port);
            callback();
        }
    }

    function done(err) {
        if (err) {
            return callback(err);
        }
    }

    function getTest(callback) {
        callback(null, js(path.join(process.cwd(), 'test.js')));
    }
}

function runBuild(callback) {
    build(function(err) {
        if (err) {
            console.error('Build failed');
            console.error(err);
        }

        if (callback) {
            callback();
        }
    });
}

function watch(callback) {
    gaze([
        '**/*.html',
        '**/*.css',
        '**/*.js'
    ], function(err, watcher) {
        if (err) {
            return callback(err);
        }

        watcher.on('all', function() { runBuild(); });
        callback();
    });
}


function redirectTest(req, resp, next) {
    if (req.url === '/test') {
        resp.writeHeader(302, {
            'Content-Length': 0,
            'Location': '/test/'
        });
        resp.end();
        return;
    }

    next();
}
