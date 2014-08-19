var webpage = require("webpage");


// TODO: document
var Controller = module.exports = function(port, debug) {
  var _this = this;
  this._control_page = this.createPage();
  this._debug        = debug;
  this._port         = port;

  this._control_page.onCallback = function() {
    _this._handleFromPage.apply(_this, arguments);
  };

  if (this._debug) {
    this._control_page.onConsoleMessage = function(msg) {
      console.log(msg);
    };
  }
};

/**
 * Invoked when control_page receives an event from the server.
 * @param {!Object} event Information about the received event.
 */
Controller.prototype._handleFromPage = function(event_data) {
  var data    = event_data.data;
  var event   = event_data.event;
  var id      = event_data.id;
  var handler = this._events[event];

  if (handler) {
    try {
      handler.call(this, data, id);
      this._log("Handled event '" + event + "' (id: " + id + ").");
    } catch(err) {
      this._log("Error handling event '" + event + "' (id: " + id + ").");
      this.emitFail(id, {
        message: err.message,
        type:    "exception"
      });
    }
  } else {
    this.emitFail(id, "Could not handle unkown event '" + event + "'");
  }
};

// TODO: document.
Controller.prototype._log = function(msg) {
  if (this._debug) {
    console.log(msg);
  }
};

/** Creates a connection to the controller server. */
Controller.prototype.connect = function() {
  this._control_page.open(
      "http://127.0.0.1:" + this._port + "/", function(status) {
    if (status !== "success") {
      console.error("Unable to connect to control page.");
      phantom.exit(1);
    }
  });
};

/**
 * Creates a new Phantom page.
 * @returns {!Object} A new Phantom page.
 */
Controller.prototype.createPage = function() {
  var page = webpage.create();
  page.settings.userAgent = "PhantomSnap";
  return page;
};

/**
 * Sends a message to Node.
 * @param {!String} event The event to send.
 * @param {Number}  id    The identifier of the message this is a response to.
 * @param {=Object} data  The data to attach to the event.
 */
Controller.prototype.emit = function(event, id, data) {
  this.evaluate(function(event, id, data) {
    console.log("Emitting event '" + event + "' (id: " + id + ").");
    socket.emit(event, id, data);
  }, event, id, data);
};

/**
 * Sends an error message to the controller.
 * @param {!Number} id   The identifier of the message being handled when the
 *                       failure occurs.
 * @param {!Object} data The data to send along the message.
 */
Controller.prototype.emitFail = function(id, data) {
  this.emit("error", id, {
    __phantom_error: true,
    data:            data
  });
};

/**
 * Shorthand to call evaluate on the control page.
 * @param {...Object} var_args The arguments to pass to control_page.evaluate.
 */
Controller.prototype.evaluate = function(var_args) {
  return this._control_page.evaluate.apply(this._control_page, arguments);
};


/*** Events Handlers ***/
Controller.prototype._events = {};

// TODO: document.
Controller.prototype._events.connected = function(data, event_id) {
  this.emit("ready", event_id);
};

// TODO: document.
Controller.prototype._events.exit = function() {
  phantom.exit();
};

// TODO: document.
//Controller.prototype._events.fetch = function() {
//  phantom.exit();
//};
