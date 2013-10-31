# hut-build

[![NPM](https://nodei.co/npm/hut-build.png?compact=true)](https://nodei.co/npm/hut-build/)

[![Build Status](https://drone.io/github.com/conradz/hut-build/status.png)](https://drone.io/github.com/conradz/hut-build/latest)
[![Dependency Status](https://gemnasium.com/conradz/hut-build.png)](https://gemnasium.com/conradz/hut-build)

HTML UI Toolkit build tool.

This tool is custom-made for the HTML UI Toolkit (`hut`) packages. It is not
intended to be a general-purpose build utility.

## Lint

Run `hut-build lint` in your project directory to lint all the source files
using JSHint. See the `jshint.json` file for the JSHint settings.

## Test

Write tests in the `test.js` file in your project directory. Tests must output
TAP-compatible output to the console. Run the tests using `hut-build test`. This
lints the source files and runs the tests on all supported browsers (see the
`browser.json` file).

Tests are run on [Sauce Labs](http://saucelabs.com/) browsers. The `SAUCE_USER`
and `SAUCE_KEY` environment variables must be set to your Sauce Labs username
and key, respectively. When running under [Travis CI](https://travis-ci.org/)
or [Drone.io](https://drone.io/), the build number is automatically sent to
Sauce Labs to update the
[status images](https://saucelabs.com/docs/status-images).

See [Serve Locally](#serve-locally) for directions on serving the test files
locally.

## Build

When writing an HTML/CSS/JS module, you can use the `hut-build build` command.
Write an example using your module in the `example` directory inside of your
project directory. Include an `index.html` file for the HTML page. You can also
include an `example.js` file that will be bundled with Browserify and an
`example.css` that will be processed with Rework. Reference the `example.js` and
`example.css` files from `index.html` file when using them.

When running `hut-build build`, the processed files (`index.html`, `example.js`,
and `example.css`) will be written to the `build` folder.

## Serve Locally

When developing, it is a pain to always run `hut-build build`. To serve the
files locally, run `hut-build serve`. This will serve the processed example
files at `http://localhost:8000/example/`. Specify the port to use with the
`--port` argument and enable source maps for JS with the `--debug` flag.

This also serves the JS tests. Run the tests at `http://localhost:8000/test/`.
The console output will be shown on the page.

## Project Structure

The project structure expected by `hut-build`:

```
my-project
 - example         # A directory containing an example using the project
   - index.html    # Example HTML file
   - example.js    # Example JS file
   - example.css   # Example CSS file
   - build         # A directory containing the built files
 - build
     - index.html  # Copied from example/index.html
     - example.css # Processed by rework
     - example.js  # Processed by browserify
 - test.js         # The JS test file, must use TAP output to console
 - package.json    # The package.json file needed for NPM
```

The `test.js` and `example/example.js` files will be processed by
[Browserify](https://github.com/substack/node-browserify). The
`example/example.css` file will be processed by
[Rework](https://github.com/visionmedia/rework), using
[rework-vars](https://github.com/visionmedia/rework-vars) and
[rework-npm](https://github.com/conradz/rework-npm).
