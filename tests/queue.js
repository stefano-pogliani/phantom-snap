var assert = require("assert");
var Queue  = require("../out/queue");


suite("Queue", function() {
  setup(function() {
    this.queue = new Queue();
  });

  test("count", function() {
    assert.equal(this.queue.count(), 0);
    this.queue.push(1);
    this.queue.push(2);
    this.queue.push(3);
    assert.equal(this.queue.count(), 3);
    this.queue.pop();
    this.queue.pop();
    assert.equal(this.queue.count(), 1);
  });

  test("fail pop", function() {
    var queue = this.queue;
    assert.throws(function() {
      queue.pop();
    }, Error);
  });

  test("pop", function() {
    this.queue.push(1);
    this.queue.push(2);
    this.queue.push(3);
    assert.equal(this.queue.pop(), 1);
    assert.equal(this.queue.pop(), 2);
    assert.equal(this.queue.pop(), 3);
    assert.equal(this.queue._head, null);
    assert.equal(this.queue._tail, null);
  });

  test("push", function() {
    this.queue.push(1);
    this.queue.push(2);
    this.queue.push(3);
    assert.notEqual(this.queue._head, null);
    assert.notEqual(this.queue._tail, null);
  });
});
