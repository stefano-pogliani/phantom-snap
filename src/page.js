/**
 * @class Page
 * Abstract rapresentaion of a page.
 * 
 * @param {!String} uri The URI of the page being represented.
 */
var Page = module.exports = function(uri, depth) {
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
