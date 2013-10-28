/*jshint node: true */

var browserify = require('browserify');

module.exports = js;

function js(file, options) {
    options = options || {};

    console.log(file);
    var src = browserify().add(file),
        bundle = src.bundle(options);

    // Pipe errors to the output stream
    src.on('error', function(err) {
        console.error(err);
        bundle.emit('error', err);
    });

    return bundle;
}
