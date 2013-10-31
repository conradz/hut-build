/*jshint node: true */

var path = require('path'),
    connect = require('connect'),
    instant = require('instant'),
    gaze = require('gaze'),
    serveScript = require('serve-script'),
    build = require('./build'),
    js = require('./js');

module.exports = serve;

function serve(options, callback) {
    var buildDir = path.join(process.cwd(), 'build'),
        port = options.port || 8000,
        app = connect()
            .use(instant(buildDir))
            .use(redirectTest)
            .use('/test/', serveScript({ src: getTest }));

    app.listen(port, started);

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
            '**/*.html',
            '**/*.css',
            '**/*.js'
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
