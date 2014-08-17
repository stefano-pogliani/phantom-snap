/*
 * System args:
 *   * Running script.
 *   * Control server port.
 */
var port    = phantom.args[0];
var webpage = require("webpage");


/**
 * The page that connects to the control server.
 */
var control_page = webpage.create();
control_page.settings.userAgent = "PhantomSnap";


/**
 * Map from events received from the controller to handlers.
 * @const
 * @type {Object}
 */
var CONTROL_EVENTS = {
  connected: require("./handlers/connected"),
  exit:      require("./handlers/exit")
};


/**
 * Invoked when control_page receives an event from the server.
 * @param {!Object} event Information about the received event.
 */
control_page.onCallback = function(event) {
  var handler = CONTROL_EVENTS[event.event];
  handler = handler || function() {};
  handler(control_page, event.data);
};

// Finally get the control page.
control_page.open("http://127.0.0.1:" + port + "/", function(status) {
	if (status !== "success") {
    console.error("Unable to connect to control page.");
    phantom.exit(1);
  }
});
