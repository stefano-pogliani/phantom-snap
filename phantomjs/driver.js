var Controller = require("./controller");


/*
 * Args:
 *   * Running script (system.args only).
 *   * Control server port (needs to be second argument to phantom).
 *   * --debug if debug mode is enabled.
 */
var port  = phantom.args[0];
var debug = phantom.args.indexOf("--debug") !== -1;


var controller = new Controller(port, debug);
controller.connect();
