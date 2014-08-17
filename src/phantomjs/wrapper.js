var child_process = require("child_process");
var express       = require("express");
var http          = require("http");
var path          = require("path");
var socketio      = require("socket.io");

var PhantomJS = require("phantomjs");
var Q         = require("q");


/**
 * Wrapper to send commands from Node to Phantom and get results back.
 * 
 * Every instance has an express.js server running and spawns a Phantom.js
 * process that connects to the express server.
 * Node and Phantom use socket.io to exchange messages and data.
 * 
 * @class Phantom
 */
var Phantom = module.exports = function(options) {
  options   = options || {};
  this.port = options.port || 8081;

  this._app     = express();
  this._logger  = options.logger || require("../default-logger");
  this._server  = http.createServer(this._app);
  this._io      = socketio.listen(this._server);

  this._clear   = null;
  this._process = null;
  this._ready   = null;
  this._socket  = null;

  // Build Phantom arguments list.
  this._args = [
    PhantomJS.path, path.join(__dirname, "driver.js"), this.port
  ];

  // Setup express and socket.io.
  this._app.use( "/", express.static(path.join(__dirname, "front")) );
  this._io.sockets.on("connection", this._handleSocketConnect.bind(this));
};


/** Cleans up uinternal state after the Phantom process terminates. */
Phantom.prototype._afterPhantomExits = function() {
  var clear = this._clear || { resolve: function() {} };

  this._logger.info("Stopping control server on port %d.", this.port);
  this._server.close(function() {
    clear.resolve();
  });

  this._clear   = null;
  this._process = null;
  this._ready   = null;
};

/** Attaches the current instance to the process running Phantom. */
Phantom.prototype._attachToProcess = function(process) {
  this._process = process;
  process.on("exit", this._handlePhantomExit.bind(this));
  process.stderr.on("data", this._handleStdErrData.bind(this));
  process.stdout.on("data", this._handleStdOutData.bind(this));
};


/*** HANDLERS ***/
/** Invoked when Phantom is ready. */
Phantom.prototype._handleReady = function() {
  this._ready = this._ready || Q.defer();
  this._ready.resolve();
};

/**
 * Handles the connection of a client.
 * @param {!Object} socket The socket used to talk to the client.
 */
Phantom.prototype._handleSocketConnect = function(socket) {
  this._socket = socket;
  socket.on("ready", this._handleReady.bind(this));

  socket.emit("connected");
};

/**
 * Receives some data from Phantom's stderr.
 * @param {!String} chunck The data from stderr.
 */
Phantom.prototype._handleStdErrData = function(chunck) {
  this._logger.debug("PhantomJS reported and error: " + chunck);
};

/**
 * Receives some data from Phantom's stdout.
 * @param {!String} chunck The data from stdout.
 */
Phantom.prototype._handleStdOutData = function(chunck) {
  this._logger.debug("PhantomJS reported: " + chunck);
};

/**
 * Invoked when the Phantom process terminates.
 * @param {!Number} code The return code of Phantom.
 */
Phantom.prototype._handlePhantomExit = function(code) {
  if (code) {
    this._logger.info("PhantomJS terminated with a non-zero code: %d.", code);
  }
  this._afterPhantomExits();
};


/**
 * Starts the control server and spawns the Phantom process.
 * @returns {!Q.Promise} A promise that resolves when Phantom is ready.
 */
Phantom.prototype.spawn = function() {
  // Prevent multiple spawns.
  if (this._ready) { return this._ready.promise; }

  var args    = this._args.join(" ");
  this._ready = Q.defer();

  this._logger.info("Starting PhantomJS control server on port %d.", this.port);
  this._server.listen(this.port);

  this._logger.info("Starting PhantomJS instance.");
  this._attachToProcess(child_process.exec(args, {
    cwd: __dirname
  }));
  return this._ready.promise;
};

/**
 * Terminates the Phantom process and stops the control server.
 * @returns {!Q.Promise} A promise that resolves when the control server 
 *                       is terminated.
 */
Phantom.prototype.stop = function() {
  this._clear = Q.defer();
  if (this._socket) {
    this._socket.emit("exit");
  }
  return this._clear.promise;
};
