// ?
var CssPollingLoadWaiter = function(options) {
  if (!options.property) {
    throw new Error("A CSS property is mandatory.");
  }
  if (!options.selector) {
    throw new Error("A selector is mandatory.");
  }
  if (options.value === undefined || options.value === null) {
    throw new Error("A value is mandatory.");
  }

  this._frequency = options.frequency || 10;
  this._match_on = {
    property: options.property,
    selector: options.selector,
    value:    options.value
  };
};


/**
 * Checks to see if the page conatins an item matching the selector and
 * the specified property.
 * 
 * @param {type} page
 * @returns {!Boolean} True if the selector was satisfied.
 */
CssPollingLoadWaiter.prototype._check = function(page) {
  return page.evaluate(function(match_on) {
    var el = document.querySelector(match_on.selector);
    return el && el.style[match_on.property] === match_on.value;
  }, this._match_on);
};

/**
 * Resume execution when the content of the page was effectivly loaded as
 * determined by each individual LoadWaiter.
 * 
 * The CssPollingLoadWaiter polls a node in the document until it is found
 * with the specified CSS property.
 * 
 * @param {!Object}   page  The Phantom page object.
 * @param {!Function} ready A callback without arguments to execute when ready.
 */
CssPollingLoadWaiter.prototype.wait = function(page, ready) {
  if (this._check(page)) {
    ready();
  } else {
    var _this = this;
    setTimeout(function() {
      _this.wait(page, ready);
    }, this._frequency);
  }
};


/**
 * Creates a new CssPollingLoadWaiter to wait on a page.
 * @param {Object} options Options sent to us from Node.
 * @returns {CssPollingLoadWaiter}
 */
module.exports = function(options) {
  return new CssPollingLoadWaiter(options || {});
};
