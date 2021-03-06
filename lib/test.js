'use strict';
/*jshint node: true */

var path = require('path'),
    async = require('async'),
    Runner = require('sauce-tap-runner'),
    js = require('./js'),
    lint = require('./lint'),
    browsers = require('../browsers');

module.exports = test;

function test(options, callback) {
    lint(options, linted);
    
    function linted(err) {
        if (err) {
            return callback(err);
        }

        runTests(callback);
    }
}

function runTests(callback) {
    var sauceUser = process.env.SAUCE_USER,
        sauceKey = process.env.SAUCE_KEY;
    if (!sauceUser || !sauceKey) {
        return callback(new Error('SAUCE_USER and SAUCE_USER must be set'));
    }

    var file = path.join(process.cwd(), 'test.js'),
        runner = new Runner(sauceUser, sauceKey);

    runner.on('error', function(e) {
        console.error(e);
    });

    async.mapSeries(browsers, runBrowser, complete);

    function script(callback) {
        callback(null, js(file));
    }

    function runBrowser(browser, callback) {
        run({
            runner: runner,
            browser: browser,
            script: script
        }, callback);
    }

    function complete(err, results) {
        var failed = (results || [])
            .filter(function(r) { return !r || !r.ok; })
            .length;

        runner.close(closed);
        
        function closed() {
            if (err) {
                return callback(err);
            }

            var failed = results
                .filter(function(r) { return !r || !r.ok; })
                .length;
            if (failed > 0) {
                return callback(new Error(failed + ' browser(s) failed'));
            }

            return callback();
        }
    }
}

function run(options, callback) {
    var runner = options.runner,
        browser = options.browser,
        script = options.script,
        build = process.env.DRONE_BUILD_NUMBER ||
            process.env.TRAVIS_BUILD_NUMBER;

    browser.build = build || null;

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
