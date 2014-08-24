var assert = require("assert");
var Q      = require("q");

var Crawler = require("../../out/drivers/crawler");


var MockFetcher = function() {
  this.fetch_map = {};
  this.fetch     = function(uri) {
    var def             = Q.defer();
    this.fetch_map[uri] = {};
    def.resolve(this.fetch_map[uri]);
    return def.promise;
  };
};

var MockProcessor = function() {
  this.called  = false;
  this.process = function() {
    this.called = true;
  };
};

var MockQueue = function() {
  this.enqueue_called = false;
  this.process_called = false;

  this.enqueue = function() {
    this.enqueue_called = true;
  };

  this.process = function(cb) {
    this.process_called = true;
    cb({
      uri:   "/",
      depth: 4
    });

    var def = Q.defer();
    def.resolve();
    return def.promise;
  };
};

var MockStatic = function() {
  this.started = false;
  this.stopped = false;
  this.start   = function() {
    this.started = true;
  };
  this.stop = function() {
    var def = Q.defer();
    this.stopped = true;
    def.resolve();
    return def.promise;
  };
};


suite("Crawler", function() {
  test("start", function(done) {
    var crawler = new Crawler({
      global: {
        logger: require("../../out/loggers/silent")
      }
    });

    // Prepare.
    crawler._fetcher   = new MockFetcher();
    crawler._processor = new MockProcessor();
    crawler._queue     = new MockQueue();
    crawler._server    = new MockStatic();

    // Act.
    crawler.start().then(function() {
      // Verify.
      assert.deepEqual(crawler._fetcher.fetch_map, {
        "/": { depth: 4 }
      });

      assert(crawler._processor.called);
      assert(crawler._queue.enqueue_called);
      assert(crawler._queue.process_called);
      assert(crawler._server.started);
      assert(crawler._server.stopped);
      done();

    }).fail(function(ex) {
      done(ex);
    });
  });
});
