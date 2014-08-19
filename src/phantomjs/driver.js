var Controller = require("./controller");


/*
 * Args:
 *   * Running script (system.args only).
 *   * Control server port.
 */
var port = phantom.args[0];


var controller = new Controller(port, true);
controller.connect();
