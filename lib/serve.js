/*jshint node: true */

var path = require('path'),
    http = require('http'),
    express = require('express'),
    instant = require('instant'),
    serveScript = require('serve-script'),
    css = require('./css'),
    js = require('./js');

module.exports = serve;

function serve(dir, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};

    var jsOpts = { debug: options.debug },
        port = typeof options.port === 'number' ? options.port : 8000;

    var app = express()
        .set('strict routing', true)
        .get('/', redirect('/example/'))
        .get('/test', redirect('/test/'))
        .use('/test/', serveTests(dir, jsOpts))
        .get('/example', redirect('/example/'))
        .get('/example/example.css', serveExampleCss(dir))
        .get('/example/example.js', serveExampleJs(dir, jsOpts))
        .use(instant(dir));

    var server = http.createServer(app);
    server.listen(port, function(err) {
        if (err) {
            return callback(err);
        }

        callback(null, server);
    });
}

function redirect(path) {
    return function(req, resp) { resp.redirect(path); };
}

function pipe(stream, resp) {
    stream.on('error', function(err) {
        resp.statusCode = 500;
        resp.setHeader('Content-Type', 'text/plain; charset=utf-8');
        resp.send(err.toString());

        console.error(err.toString());
    });

    stream.pipe(resp);
}

function serveTests(dir, options) {
    var file = path.join(dir, 'test.js');
    function src(callback) {
        callback(null, js(file, options));
    }

    return serveScript({ src: src });
}

function serveExampleCss(dir) {
    var file = path.join(dir, 'example', 'example.css');
    return function(req, resp) {
        resp.setHeader('Content-Type', 'text/css; charset=utf-8');
        pipe(css(file), resp);
    };
}

function serveExampleJs(dir, options) {
    var file = path.join(dir, 'example', 'example.js');
    return function(req, resp) {
        resp.setHeader(
            'Content-Type',
            'application/javascript; charset=utf-8');
        pipe(js(file, options), resp);
    };
}
