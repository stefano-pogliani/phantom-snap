var NoopLoadWaiter = module.exports = {};

/**
 * Resume execution when the content of the page was effectivly loaded as
 * determined by each individual LoadWaiter.
 * 
 * The NoopLoadWaiter does not actually wait and assumes that the page is ready
 * as soon as Phantom finished loading it.
 * 
 * @param {!Object}   page  The Phantom page object.
 * @param {!Function} ready A callback without arguments to execute when ready.
 */
NoopLoadWaiter.wait = function(page, ready) {
  ready();
};
