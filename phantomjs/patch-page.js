/**
 * Patches a Phantom page to introduce commonly used JavaScript features that
 * are missing in Phantom.
 * 
 * @param {!Object} page A Phantom page instance.
 */
module.exports = function(page) {
  page.evaluate(function() {
    /* jshint ignore:start */

    // Function.bind polyfill from MDN
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
    if (!Function.prototype.bind) {
      console.log("Patching Function.prototype.bind");
      Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
          // closest thing possible to the ECMAScript 5
          // internal IsCallable function
          throw new TypeError(
              "Function.prototype.bind - what is trying to be bound is " +
              "not callable"
          );
        }

        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
              return fToBind.apply(this instanceof fNOP && oThis
                     ? this
                     : oThis,
                     aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
      };
    }

    /* jshint ignore:end */
  });
};
