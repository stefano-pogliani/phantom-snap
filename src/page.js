/**
 * @class Page
 * Abstract rapresentaion of a page.
 * 
 * @param {!String} uri   The URI of the page being represented.
 * @param {=Number} depth The dinsance of this page from the main page. 
 */
var Page = module.exports = function(uri, depth) {

  /**
   * Reference to the Phantom wrapper to comunicate with the instance that
   * loaded this page.
   * @type {Phantom}
   */
  this.phantom = null;

  /**
   * Id of the page in the Phantom fetching process.
   * @type {Number}
   */
  this.phantom_id = null;

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
