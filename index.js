/*jshint node: true */

var express = require('express'),
    makeup = require('makeup'),
    npmcss = require('npm-css'),
    path = require('path'),
    fs = require('fs'),
    http = require('http'),
    serveBrowserify = require('browserify-middleware'),
    browserify = require('browserify'),
    _ = require('lodash'),
    mkdirp = require('mkdirp');

var template = fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf8');
template = _.template(template);

function defaultCallback(err) {
    if (err) {
        throw err;
    }
}

function getPackage(dir) {
    var file = path.join(dir, 'package.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function getProject(dir) {
    var example = path.join(dir, 'example');

    return {
        dir: dir,
        example: example,
        package: getPackage(dir),
        index: path.join(example, 'index.html'),
        script: path.join(example, 'script.js'),
        style: path.join(example, 'style.css')
    };
}

function createApp() {
    var app = express(),
        project = getProject(process.cwd());

    app.use('/style.css', makeup(project.style));
    app.use('/script.js', serveBrowserify(project.script, {
        debug: true,
        basedir: project.dir
    }));

    app.get('/', function(req, resp, next) {
        fs.readFile(project.index, 'utf8', function(err, content) {
            if (err) {
                return next(err);
            }

            resp.setHeader('Content-Type', 'text/html; charset=utf-8');
            resp.end(template({
                name: project.package.name,
                content: content
            }));
        });
    });

    app.use(express.static(project.dir));

    return app;
}

function serve(options, callback) {
    callback = callback || defaultCallback;

    var port = (options && options.port) || 8000,
        server = http.createServer(createApp());
    server.listen(port, function(err) {
        if (err) {
            return callback(err);
        }

        console.log('Listening on port', port);
        callback();
    });
}

function build(callback) {
    callback = callback || defaultCallback;
    
    var project = getProject(process.cwd()),
        output = path.join(project.dir, 'dist');

    mkdirp(output, createdDir);

    function createdDir(err) {
        if (err) {
            return callback(err);
        }

        fs.readFile(project.index, 'utf8', readIndex);
    }

    function readIndex(err, contents) {
        if (err) {
            return callback(err);
        }

        var index = template({
            name: project.package.name,
            content: contents
        });
        
        fs.writeFile(path.join(output, 'index.html'), index, wroteIndex);
    }

    function wroteIndex(err) {
        if (err) {
            return callback(err);
        }

        var css;
        try { css = npmcss(project.style); }
        catch(e) { return callback(e); }

        fs.writeFile(path.join(output, 'style.css'), css, wroteStyle);
    }

    function wroteStyle(err) {
        if (err) {
            return callback(err);
        }

        var script = browserify()
            .add(project.script)
            .bundle(),
            scriptOut = fs.createWriteStream(
                path.join(output, 'script.js'), { encoding: 'utf8' });
        script.pipe(scriptOut);

        script.on('error', function(e) { callback(e); });
        script.on('done', function() { callback(); });
    }
}

module.exports = {
    createApp: createApp,
    serve: serve,
    build: build
};