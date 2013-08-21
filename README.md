# hut-build

[![Build Status](https://travis-ci.org/conradz/hut-build.png?branch=master)](https://travis-ci.org/conradz/hut-build)
[![Dependency Status](https://gemnasium.com/conradz/hut-build.png)](https://gemnasium.com/conradz/hut-build)

HTML UI Toolkit build tool.

This tool is custom-made for the HTML UI Toolkit (`hut`) packages. It is not
intended to be a general-purpose build utility.

## Tests

Tests are run and served by the
[chi-build](https://github.com/conradz/chi-build) package. Running
`hut-build test` is the same as running `chi-build test`. Running
`hut-build serve-test` is the same as running `chi-build serve`.

## Serve Examples

To serve example files run `hut-build serve`. The project must be structured as
follows:

```
my-project
 - example
   - index.html
   - script.js
   - style.css
 - package.json
```

The `index.html` file is an HTML snippet that will be wrapped in a full HTML
document by the server. The generated document automatically adds references to
`script.js` and `script.css`. The `script.js` file will be bundled by
[browserify](https://github.com/substack/node-browserify) before being served.
The `style.css` will be preprocessed by
[npm-css](https://github.com/shtylman/npm-css) before being served.

With the server running, you can browse to `http://localhost:8000/` to see the
example. When you refresh the browser, it will automatically recompile the
source code in memory.

## Building

To build the example files to the `dist` folder run `hut-build build`. The
project must be structured as described above. The files that would be served by
the server (the `index.html`, `script.js`, and `style.css` files) are compiled
and placed in the `dist` folder.

## API

You can use the JS API in another script.

## `serve(options)`

Start an HTTP server, the same as running `hut-build serve`. `options` may
contain a `port` property (default 8000) which specifies the port for the HTTP
server. The example directory must be in the current working directory.

## `app()`

Creates the [connect](https://github.com/senchalabs/connect) app that is used by
`serve`.

## `build()`

Build the dist files. Same as running `hut-build build`.