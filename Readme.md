Introduction
============
Have you developed a client side, JavaScript generated, web site or
application and want it indexed?
There are several tools out there for you but I could not find one that
met my needs.
This is why I created `PhantomSnap`.

What it is
----------
`PhantomSnap` is a tool to automatically generate HTML snapshots of your site
or application.
You give it the location of your code, a destination directory and a main URL.

`PhantomSnap` will fire up an HTTP server pointing at your sources and will use
[PhantomJS](http://phantomjs.org/) to load your main page and crawl its way
through your website, storing HTML versions of you pages into the
destination directory.

What it is *NOT*
----------------
  * A server to compile your URLs on the fly (it turns out that with my design
    it is possible to do this too but I did not get around to do it).
  * A way to test/check/verify your site or application.
  * An optimised version of [PhantomJS](http://phantomjs.org/).

Current limitations
-------------------
  * Timeouts on operations are an easy way to recover from unexpected errors
    of your site or application but they will be implemented in later
    iterations.
  * Error reporting and retries are a bit more complex that timeouts but
    are planned for feature releases as well.
  * Project not yet available on `NPM`.
  * Only usable through the `Grunt` task or by implementing the main
    function to instantiate all components manually.

Known issues
------------
  * Crawling sites or applications on top of previous snapshots may cause
    errors where files try to overwrite directories.
  * It usually happened around failing tests that did not clean up properly
    but it might happen that the [PhantomJS](http://phantomjs.org/) instance
    does not terminate.
    This could lead to unexpected behaviours as only one for each crawler
    is assumed.


Usage
=====
Using `PhantomSnap` is all about passing the right options to the grunt task.
Since there are quite a few options, all documented in the docstrings on the
constructors of the relevant classes (the section "Organisation of the code"
may help you figure this out), I will be focusing on the primarily target
usage: crawling a website or application as part of the Grunt pipeline.

Installing
----------
First of all you will need to add `PhantomSnap` to your `package.json`.
As I said it is not yet on `NPM` but that should not stop you.
Simply add this:
```javascript
"phantom-snap": "git+ssh://git@github.com:stefano-pogliani/phantom-snap.git#release/latest"
```

Note that `release/latest` should be changed to a fixed version to avoid
updates breaking your project unexpectedly.
`NPM` does not support versions when fetching directly from git.

Once `PhantomSnap` is `npm install`ed it can be loaded in `Grunt` with
```javascript
grunt.loadNpmTasks("phantom-snap");
```

Options are specified in the `snapshot` task and can be both in the object
as well as in the `options` property of that object.
The following example will be used to explain some of the most common options:
```javascript
snapshot: {
  verbose_logging: true,
  crawler: {
    base_path: path.join(__dirname, "seo", "snapshot"),
    index:     "/"
  },
  fetcher: {
    base_url:       "http://localhost:8080/index.html#!",
    waiter_options: {
      path:     "./waiters/css-polling",
      property: "display",
      selector: "#route-loading",
      value:    "none"
    }
  },
  static: { path: path.join(__dirname, "out") }
}
```

  * `verbose_logging` will make PhantomSnap output logs at debug level.
    When off (the default) no logs are printed (none at all, not yet at least).
    While usually you should not need them, you may be curious or just want to
    double check that the process is actually doing something.
  * The `crawler` is the component that drives the whole process.
    * `base_path` is the destination directory for the snapshot.
    * `index` is the URI of the page to load first.
  * The `fetcher` is the component that loads individual pages in
    [PhantomJS](http://phantomjs.org/).
    * `base_url` is prefixed to each page URI to build the full URL to fetch.
      This example is taken from a "single page" web site that uses the
      hash-bang (`#!`) syntax for routes.
    * `waiter_options` is the reason regular crawling tools don't cut it.
      It is not difficult to understand but it is very important so I will
      explain it on its own.
  * `static` is a static server that will serve files out of `path`.
    If you prefer other ways to serve your application or web site or it
    requires more than a static server omit this option.
    If this option is omitted no server is started and you can use the
    `base_url` in the `fetcher` to access the pages.

### Load Waiters
The main problem with crawling JavaScript generated content is that the
crawler has to wait for the content to be actually ready and it cannot
rely on availability of the HTML or the document loaded event.

Thanks to project like [PhantomJS](http://phantomjs.org/) running the pages
themselves is now easy but waiting for the content is still tricky since each
site and application have different ways to represent the waiting for content.

_Load waiters_ are the tools used by the fetcher to know when the page is
finally ready.
By default `PhantomSnap` comes with the following waiters:

  * The `noop` waiter immediately returns and does not have any option.
  * The `css-polling` waiter looks for an element in the document with a
    specific CSS property.
    The options are used to specify the condition to wait for:
    The `property` is a CSS property name, in browser syntax, to look up on
    the first element found using the `selector` and to check for equality
    with `value`.

Additional waiters will be implemented in future iterations or can be
implemented to fit your needs.


Extending and/or contributing
=============================
This project is a [NodeJS](http://nodejs.org/) application that controls a
[PhantomJS](http://phantomjs.org/) instance.
This is done by serving a control page from [NodeJS](http://nodejs.org/)
which will use web sockets to communicate with PhantomJS.

When the PhantomJS instance is started the control page served by NodeJS is
opened and used to receive commands and send responses.

One project, three JavaScripts
------------------------------
As a result of this there are three variations of JavaScript around the project.
The outer shell is written in Node and is located in the `src/` directory
of the project.

The second layer is in PhantomJS, which is similar to Node when it comes to
the modules system and the `fs` module but different otherwise.
The PhantomJS sources are located under `src/phantomjs` with the exception of
`src/phantomjs/wrapper.js` which is the NodeJS side of the controller.
PhantomJS execution starts from `src/phantomjs/driver.js`, which does very
little.

The final layer in this stack is the JavaScript that runs in PhantomJS pages
themselves.
This includes the code in `src/phantomjs/front`, which is the client side
web socket channel, and the code injected into the pages through the `evaluate`
function.
Although the `evaluate` function is used in several places the main
concentration is in the waiters, found in `src/phantomjs/waiters`.

Writing waiters
---------------
Waiters are PhantomJS modules that export a factory function that receives the
options defined in the `waiter_options` portion of the configuration.
The value returned by the factory function is assumed to have a `wait`
function that takes a PhantomJS page instance and a ready callback.
The the waiter determines that the page is ready it should invoke the
callback without arguments.
For examples and documentation you can refer to the existing `noop` and
`css-polling` waiters in `src/phantomjs/waiters`.


License
=======
The MIT License (MIT)

Copyright (c) 2014 Stefano Pogliani

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
