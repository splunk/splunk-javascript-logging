var Log = function (logger) {
    this.splunkLogger = logger;
};

/**
 * Fits data into send payload format
 *
 * @param {anything} content
 * @param {string} (optional) severity
 * @returns {{message, content, severity: severity}}
 * @private
 */
Log.prototype._prep_context = function(content, severity, metadata) {
    var context = {
        "message": content,
        "severity": severity
    };
    if (metadata || this.metadata) { context.metadata = metadata || this.metadata; }
    return context;
};

/**
 * Sets the default metadata values
 *
 * @example
 * metadata = {
 *      source: "chicken coop",
 *      sourcetype: "httpevent",
 *      index: "main",
 *      host: "farm.local",
 * };
 * logger.log.set_metadata(metadata);
 *
 * @param metadata
 */
Log.prototype.set_metadata = function (metadata) {
    if (typeof metadata === "object") { this.metadata = metadata; }
};

/**
 * Clears the default metadata values
 *
 * @example
 * logger.log.clear_metadata();
 */
Log.prototype.clear_metadata = function() {
    this.metadata = undefined;
};

/**
 * Fits data into send payload format
 * Assumes that the object is not already in send format, if so use logger.send
 * Will be sent with the default severity level - 'info' unless configured
 *
 * @examples
 * logger.log.log(string_payload)
 * logger.log.log(object_payload)
 * logger.log.log(array_payload, callback)
 * logger.log.log(numerical_payload, callback)
 *
 * @param {anything} message - message or object to be logged.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>
 * @public
 */
Log.prototype.log = function(message, callback) {
    var context = this._prep_context(message);
    this.splunkLogger.send(context, callback);
};

/**
 * Fits data into send format and set severity to 'info'
 * Assumes that the object is not already in send format, if so use logger.send
 *
 * @examples
 * logger.log.info(string_payload)
 * logger.log.info(object_payload)
 * logger.log.info(array_payload, callback)
 * logger.log.info(numerical_payload, callback)
 *
 * @param {anything} message - message or object to be logged.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>
 * @public
 */
Log.prototype.info = function(message, callback) {
    var context = this._prep_context(message, "info");
    this.splunkLogger.send(context, callback);
};

/**
 * Fits data into send format and set severity to 'debug'
 * Assumes that the object is not already in send format, if so use logger.send
 *
 * @example
 * logger.log.debug(string_payload)
 * logger.log.debug(object_payload)
 * logger.log.debug(array_payload, callback)
 * logger.log.debug(numerical_payload, callback)
 *
 * @param {anything} message - message or object to be logged.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>
 * @public
 */
Log.prototype.debug = function(message, callback) {
    var context = this._prep_context(message, "debug");
    this.splunkLogger.send(context, callback);
};

/**
 * Fits data into send format and set severity to 'warn'
 * Assumes that the object is not already in send format, if so use logger.send
 *
 * @example
 * logger.log.warn(string_payload)
 * logger.log.warn(object_payload)
 * logger.log.warn(array_payload, callback)
 * logger.log.warn(numerical_payload, callback)
 *
 * @param {anything} message - message or object to be logged.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>
 * @public
 */
Log.prototype.warn = function(message, callback) {
    var context = this._prep_context(message, "warn");
    this.splunkLogger.send(context, callback);
};

/**
 * Fits data into send format and set severity to 'error'
 * Assumes that the object is not already in send format, if so use logger.send
 *
 * @example
 * logger.log.error(string_payload)
 * logger.log.error(object_payload)
 * logger.log.error(array_payload, callback)
 * logger.log.error(numerical_payload, callback)
 *
 * @param {anything} message - message or object to be logged.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>
 * @public
 */
Log.prototype.error = function(message, callback) {
    var context = this._prep_context(message, "error");
    this.splunkLogger.send(context, callback);
};

module.exports = Log;