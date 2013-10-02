/*jshint node: true */

var path = require('path'),
    async = require('async'),
    _ = require('lodash'),
    Runner = require('sauce-tap-runner'),
    js = require('./js'),
    browsers = require('../browsers');

module.exports = test;

function test(dir, callback) {
    var sauceUser = process.env.SAUCE_USER,
        sauceKey = process.env.SAUCE_KEY;
    if (!sauceUser || !sauceKey) {
        return callback(new Error('SAUCE_USER and SAUCE_USER must be set'));
    }

    var file = path.join(dir, 'test.js'),
        runner = new Runner(sauceUser, sauceKey);

    async.eachSeries(browsers, runBrowser, complete);

    function script(callback) {
        callback(null, js(file));
    }

    function runBrowser(browser, callback) {
        run(runner, browser, script, callback);
    }

    function complete(err, results) {
        var failed = (results || [])
            .filter(function(r) { return !r.ok; })
            .length;

        runner.close(function() {
            if (!err && failed > 0) {
                err = new Error(failed + ' browser(s) failed');
            }

            callback(err);
        });
    }
}

function run(runner, browser, script, callback) {
    var build = process.env.DRONE_BUILD_NUMBER ||
        process.env.TRAVIS_BUILD_NUMBER;

    browser = _.clone(browser);
    if (build) {
        browser.build = build;
    }

    console.log('Testing browser', browser.name + '...');
    runner.run(script, browser, function(err, results) {
        if (err) {
            return callback(err);
        }

        outputResults(browser, results);
        callback(null, results);
    });
}


function outputResults(browser, results) {
    if (!results.ok) {
        console.error(
            'Browser', browser.name,
            'failed', results.fail.length, 'test(s).');
    } else {
        console.log('Browser', browser.name, 'passed all tests!');
    }

    results.fail.forEach(function(t) {
        console.error('Test #' + t.number + ':', t.name, 'failed.');
    });

    results.errors.forEach(function(e) {
        console.error('TAP parsing error:', e.message);
    });
}
