/**
 * A node in a linked list.
 * @class Node
 * 
 * @param {Object} item The item attached to the Node.
 */
var Node = function Node(item) {
  this.item = item;
  this.next = null;
};


/**
 * Implementation of first-in-first-out queues in JavaScript.
 * @class Queue
 */
var Queue = module.exports = function Queue() {
  this._count = 0;
  this._head  = null;
  this._tail  = null;
};

/** @returns {!Number} The number of items in the queue. */
Queue.prototype.count = function() {
  return this._count;
};

/**
 * Removes an item from the top of the queue and returns it.
 * @returns {Object} The item on top of the queue.
 */
Queue.prototype.pop = function() {
  if (this._head) {
    var item     = this._head.item;
    this._count -= 1;
    this._head   = this._head.next;

    if (this._head === null) {
      this._tail = null;
    }
    return item;

  } else {
    throw new Error("Cannot pop from empty queue.");
  }
};

/**
 * Adds an item to the end of the queue.
 * @param {Object} item The item to add to the queue.
 */
Queue.prototype.push = function(item) {
  var node = new Node(item);
  this._count += 1;

  if (this._tail) {
    this._tail.next = node;
    this._tail      = node;
  } else {
    this._head = this._tail = node;
  }
};
