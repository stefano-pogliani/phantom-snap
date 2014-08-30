var path = require("path");
var Q    = require("q");


/**
 * @class Page
 * Abstract rapresentaion of a page.
 * 
 * @param {!Object} phantom The Phantom bridge that owns this page.
 * @param {!String} uri     The URI of the page being represented.
 * @param {=Number} depth   The dinsance of this page from the main page. 
 */
var Page = module.exports = function Page(phantom, uri, depth) {
  /**
   * Reference to the Phantom wrapper to comunicate with the instance that
   * loaded this page.
   * @type {Phantom}
   * @protected
   */
  this._phantom = phantom;

  /**
   * Id of the page in the Phantom fetching process.
   * @type {Number}
   * @protected
   */
  this._phantom_id = null;

  /**
   * Title of the page.
   * @type {String}
   */
  this.title = null;

  /**
   * The URI of the page.
   * @type {!String}
   */
  this.uri = uri;

  /**
   * The dinsance of this page from the crawling entry point.
   * @type {!Number}
   */
  this.depth = depth || 0;
};

/**
 * Verifies that the page is still attached to a valid Phantom wrapper.
 * @returns {Q.Promise} A promise that resolves if the page is attached to
 *                      a valid Phantom wrapper or is rejected if not.
 */
Page.prototype._verifyPhantom = function() {
  var deferred = Q.defer();
  if (this._phantom && this._phantom.isRunning() &&
      typeof this._phantom_id === "number") {
    deferred.resolve(this);
  } else {
    deferred.reject(new Error(
        "Page with uri '" + this.uri +
        "' no longer has a valid Phantom instance."
    ));
  }
  return deferred.promise;
};

/**
 * Appends HTML to this page after the specified element.
 * @param {!String} selector CSS selector for the container element.
 * @param {!String} html     HTML string to append to the container.
 * @returns {Q.Promise} A promise that resolves when done.
 */
Page.prototype.appendTo = function(selector, html) {
  return this._verifyPhantom().then(function(page) {
    return page._phantom.appendTo(page._phantom_id, selector, html);
  });
};

/**
 * Closes the page on Phantom and cleans up references.
 * @returns {Q.Promise} A promise that resolves when the page is closed.
 */
Page.prototype.close = function() {
  return this._verifyPhantom().then(function(page) {
    return page._phantom.close(page._phantom_id).then(function() {
      return page;
    });
  }).then(function(page) {
    page.detachPhantom();
  });
};

/** Removes the references to Phantom from the page. */
Page.prototype.detachPhantom = function() {
  this._phantom    = null;
  this._phantom_id = null;
};

/**
 * Gets the HTML for the page.
 * @returns {Q.Promise} A promise that resolves when the HTML is available.
 */
Page.prototype.getContent = function() {
  return this._verifyPhantom().then(function(page) {
    return page._phantom.getContentFor(page._phantom_id);
  });
};

/**
 * Lists all the links in the page.
 * @returns {Q.Promise} A promise that resolves to a list of links in the page.
 */
Page.prototype.listLinks = function() {
  return this._verifyPhantom().then(function(page) {
    return page._phantom.listLinksFor(page._phantom_id);
  });
};

/**
 * Renders the page to a file.
 * @returns {Q.Promise} A promise that resolves when the page is saved.
 */
Page.prototype.render = function(filename) {
  var absolute = path.resolve(filename);
  return this._verifyPhantom().then(function(page) {
    return page._phantom.render(page._phantom_id, absolute);
  });
};
