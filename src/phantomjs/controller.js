var webpage = require("webpage");


/**
 * Phantom side controller that comunicates with Node.
 * @class Controller
 * 
 * @param {!Number}  port  The port the server is listening on.
 * @param {!Boolean} debug Enable debug mode, which prints status messages to
 *                         stdout.
 */
var Controller = module.exports = function(port, debug) {
  var _this          = this;
  this._control_page = this.createPage();
  this._debug        = debug;
  this._port         = port;

  this._page_id = 0;
  this._pages   = {};

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
      this._log(err.stack);
      this.emitFail(id, {
        message: err.message,
        trace:   err.stack,
        type:    "exception"
      });
    }
  } else {
    this.emitFail(id, "Could not handle unkown event '" + event + "'");
  }
};

/**
 * Outputs the message if debug mode is enabled.
 * @param {!String} msg The message to output.
 */
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
  this.emit("report-error", id, {
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

/** The control server is ready to deal with me. */
Controller.prototype._events.connected = function(data, event_id) {
  this.emit("ready", event_id);
};

/** The control server requestes me to exit. */
Controller.prototype._events.exit = function() {
  phantom.exit();
};

/**
 * The control server wants me to load a new page.
 * 
 * @param {String} url      The url of the page to fetch.
 * @param {Number} event_id The unique id of the request event.
 */
Controller.prototype._events.fetch = function(data, event_id) {
  var controller = this;
  var page       = this.createPage();

  page.open(data.url, function(status) {
    if (status !== "success") {
      controller.emitFail(event_id, status);
      return;
    }

    var page_id = controller._page_id++;
    var waiter  = require(data.waiter_path);
    controller._pages[page_id] = page;

    // Wait for page to (really) load.
    waiter.wait(page, function() {
      controller.emit("fetched", event_id, {
        id:    page_id,
        title: page.title
      });
    });
  });
};
