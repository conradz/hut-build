var gaze = require('gaze');

module.exports = watch;

function watch(action, callback) {
    gaze([
        '**/*.js',
        '**/*.css',
        '**/*.html'
    ], done);

    function done(err, watcher) {
        if (err) {
            return callback(err);
        }

        watcher.on('all', action);
    }
}
