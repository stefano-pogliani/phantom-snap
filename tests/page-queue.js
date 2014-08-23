var assert    = require("assert");
var Q         = require("q");
var PageQueue = require("../out/page-queue");


suite("PageQueue", function() {
  setup(function() {
    this.queue = new PageQueue({
      logger: require("../out/loggers/silent")
    });
  });

  test("enqueue", function() {
    assert.equal(this.queue._queue.count(), 0);
    this.queue.enqueue("abc");
    this.queue.enqueue("abc");
    assert.equal(this.queue._queue.count(), 1);
  });

  test("process", function(done) {
    var popped = [];
    this.queue.enqueue("abc");
    this.queue.enqueue("def");

    this.queue.process(function(uri) {
      popped.push(uri);
    }).then(function() {
      assert.deepEqual(popped, ["abc", "def"]);
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });

  test("process with re-enqueue", function(done) {
    var popped = [];
    var queue  = this.queue;
    queue.enqueue("abc");

    queue.process(function(uri) {
      if (uri === "abc") {
        queue.enqueue("def");
      }
      popped.push(uri);

    }).then(function() {
      assert.deepEqual(popped, ["abc", "def"]);
      done();

    }).fail(function(ex) {
      done(ex);
    });
  });

  test("process concurrency", function(done) {
    var popped = [];
    this.queue.enqueue(20);
    this.queue.enqueue(10);
    this.queue.enqueue(15);
    this.queue.enqueue( 5);
    this.queue.enqueue( 1);

    this.queue.process(function(ms) {
      var def = Q.defer();
      setTimeout(function() {
        def.resolve();
      }, ms);
      return def.promise.then(function() {
        popped.push(ms);
      });
    }, 2).then(function() {
      assert.deepEqual(popped, [10, 20, 5, 15, 1]);
      done();
    }).fail(function(ex) {
      done(ex);
    });
  });
});
