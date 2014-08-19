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
 * Sends an error message to the controller.
 * @param {!Number} id   The identifier of the message being handled when the
 *                       failure occurs.
 * @param {!Object} data The data to send along the message.
 */
var emitFail = function(id, data) {
  control_page.evaluate(function() {
    socket.emit("error", id, {
      __phantom_error: true,
      data:            data
    });
  });
};

/**
 * Invoked when control_page receives an event from the server.
 * @param {!Object} event Information about the received event.
 */
control_page.onCallback = function(event) {
  var handler = CONTROL_EVENTS[event.event];
  if (handler) {
    try {
      handler(control_page, event.data, event.id);
    } catch(ex) {
      emitFail(event.id, {
        message: ex.message
      });
    }
  } else {
    emitFail(event.id, "");
  }
};

// Finally get the control page.
control_page.open("http://127.0.0.1:" + port + "/", function(status) {
	if (status !== "success") {
    console.error("Unable to connect to control page.");
    phantom.exit(1);
  }
});

control_page.onAlert = function(msg) {
  console.log(msg);
};
