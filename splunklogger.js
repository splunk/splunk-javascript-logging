/*
 * Copyright 2015 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

var request = require("request");
var url = require("url");

var utils = require("./utils");

/**
 * Default error handler for <code>SplunkLogger</code>.
 * Prints the <code>err</code> and <code>context</code> to console.
 *
 * @param {Error|string} err - The error message, or an <code>Error</code> object.
 * @param {object} [context] - The <code>context</code> of an event.
 * @private
 */
/* istanbul ignore next*/
function _err(err, context) {
    console.log("ERROR:", err, " CONTEXT", context);
}

/**
 * The default format for Splunk events.
 *
 * This function can be overwritten, and can return any type (string, object, array, etc.)
 *
 * @param {anything} [message] - The event message.
 * @param {string} [severity] - The event severity.
 * @return {any} The event format to send to Splunk,
 */
function _defaultEventFormatter(message, severity) {
    var event = {
        message: message,
        severity: severity
    };
    return event;
}

/**
 * Constructs a SplunkLogger, to send events to Splunk via the HTTP Event Collector.
 * See <code>defaultConfig</code> for default configuration settings.
 *
 * @example
 * var SplunkLogger = require("splunk-logging").Logger;
 *
 * var config = {
 *     token: "your-token-here",
 *     name: "my application",
 *     host: "splunk.local",
 *     autoFlush: true
 * };
 *
 * var logger = new SplunkLogger(config);
 *
 * @property {object} config - Configuration settings for this <code>SplunkLogger</code> instance.
 * @param {object} requestOptions - Options to pass to <code>{@link https://github.com/request/request#requestpost|request.post()}</code>.
 * See the {@link http://github.com/request/request|request documentation} for all available options.
 * @property {object[]} contextQueue - Queue of <code>context</code> objects to be sent to Splunk.
 * @property {function} eventFormatter - Formats events, returning an event as a string, <code>function(message, severity)</code>.
 * Can be overwritten, the default event formatter will display event and severity as properties in a JSON object.
 * @property {function} error - A callback function for errors: <code>function(err, context)</code>.
 * Defaults to <code>console.log</code> both values;
 *
 * @param {object} config - Configuration settings for a new [SplunkLogger]{@link SplunkLogger}.
 * @param {string} config.token - Splunk HTTP Event Collector token, required.
 * @param {string} [config.name=splunk-javascript-logging/0.8.0] - Name for this logger.
 * @param {string} [config.host=localhost] - Hostname or IP address of Splunk server.
 * @param {string} [config.maxRetries=0] - How many times to retry when HTTP POST to Splunk fails.
 * @param {string} [config.path=/services/collector/event/1.0] - URL path to send data to on the Splunk server.
 * @param {string} [config.protocol=https] - Protocol used to communicate with the Splunk server, <code>http</code> or <code>https</code>.
 * @param {number} [config.port=8088] - HTTP Event Collector port on the Splunk server.
 * @param {string} [config.url] - URL string to pass to {@link https://nodejs.org/api/url.html#url_url_parsing|url.parse}. This will try to set
 * <code>host</code>, <code>path</code>, <code>protocol</code>, <code>port</code>, <code>url</code>. Any of these values will be overwritten if 
 * the corresponding property is set on <code>config</code>.
 * @param {string} [config.level=info] - Logging level to use, will show up as the <code>severity</code> field of an event, see
 *  [SplunkLogger.levels]{@link SplunkLogger#levels} for common levels.
 * @param {bool} [config.autoFlush=true] - Send events immediately or not.
 * @param {number} [config.batchInterval=0] - If <code>config.autoFlush === true</code>, automatically flush events after this many milliseconds.
 * When set to a non-positive value, events will be sent one by one. This setting is ignored when non-positive.
 * @param {number} [config.maxBatchSize=0] - If <code>config.autoFlush === true</code>, automatically flush events after the size of queued
 * events exceeds this many bytes. This setting is ignored when non-positive.
 * @param {number} [config.maxBatchCount=0] - If <code>config.autoFlush === true</code>, automatically flush events after this many
 * events have been queued. This setting is ignored when non-positive.
 * @constructor
 * @throws Will throw an error if the <code>config</code> parameter is malformed.
 */
var SplunkLogger = function(config) {
    this._timerID = null;
    this._timerDuration = 0;
    this.config = this._initializeConfig(config);
    this.requestOptions = this._initializeRequestOptions();
    this.contextQueue = [];
    this.eventsBatchSize = 0;
    this.eventFormatter = _defaultEventFormatter;
    this.error = _err;

    this._enableTimer = utils.bind(this, this._enableTimer);
    this._disableTimer = utils.bind(this, this._disableTimer);
    this._initializeConfig = utils.bind(this, this._initializeConfig);
    this._initializeRequestOptions = utils.bind(this, this._initializeRequestOptions);
    this._validateMessage = utils.bind(this, this._validateMessage);
    this._initializeMetadata = utils.bind(this, this._initializeMetadata);
    this._initializeContext = utils.bind(this, this._initializeContext);
    this._makeBody = utils.bind(this, this._makeBody);
    this._post = utils.bind(this, this._post);
    this._sendEvents = utils.bind(this, this._sendEvents);
    this.send = utils.bind(this, this.send);
    this.flush = utils.bind(this, this.flush);
};

/**
 * Enum for common logging levels.
 *
 * @default info
 * @readonly
 * @enum {string}
 */
SplunkLogger.prototype.levels = {
    DEBUG: "debug",
    INFO: "info",
    WARN: "warn",
    ERROR: "error"
};

var defaultConfig = {
    name: "splunk-javascript-logging/0.8.0",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    port: 8088,
    level: SplunkLogger.prototype.levels.INFO,
    autoFlush: true,
    maxRetries: 0,
    batchInterval: 0,
    maxBatchSize: 0,
    maxBatchCount: 0
};

var defaultRequestOptions = {
    json: true, // Sets the content-type header to application/json
    strictSSL: false
};

/**
 * Disables the interval timer set by <code>this._enableTimer()</code>.
 *
 * param {Number} interval - The batch interval.
 * @private
 */
SplunkLogger.prototype._disableTimer = function() {
    if (this._timerID) {
        clearInterval(this._timerID);
        this._timerDuration = 0;
        this._timerID = null;
    }
};

/**
 * Configures an interval timer to flush any events in
 * <code>this.contextQueue</code> at the specified interval.
 *
 * param {Number} interval - The batch interval in milliseconds.
 * @private
 */
SplunkLogger.prototype._enableTimer = function(interval) {
    // Only enable the timer if possible
    interval = utils.validateNonNegativeInt(interval, "Batch interval");

    if (this._timerID) {
        this._disableTimer();
    }
    
    // If batch interval is changed, update the config property
    if (this.config) {
        this.config.batchInterval = interval;
    }

    this._timerDuration = interval;

    var that = this;
    this._timerID = setInterval(function() {
        if (that.contextQueue.length > 0) {
            that.flush();
        }
    }, interval);
};

/**
 * Sets up the <code>config</code> with any default properties, and/or
 * config properties set on <code>this.config</code>.
 *
 * @return {object} config
 * @private
 * @throws Will throw an error if the <code>config</code> parameter is malformed.
 */
SplunkLogger.prototype._initializeConfig = function(config) {
    // Copy over the instance config
    var ret = utils.copyObject(this.config);

    if (!config) {
        throw new Error("Config is required.");
    }
    else if (typeof config !== "object") {
        throw new Error("Config must be an object.");
    }
    else if (!ret.hasOwnProperty("token") && !config.hasOwnProperty("token")) {
        throw new Error("Config object must have a token.");
    }
    else if (typeof ret.token !== "string" && typeof config.token !== "string") {
        throw new Error("Config token must be a string.");
    }
    else {
        // Specifying the url will override host, port, scheme, & path if possible
        if (config.url) {
            var parsed = url.parse(config.url);

            // Ignore the path if it's just "/"
            var pathIsNotSlash = parsed.path && parsed.path !== "/";

            if (parsed.protocol) {
                config.protocol = parsed.protocol.replace(":", "");
            }
            if (parsed.port) {
                config.port = parsed.port;
            }
            if (parsed.hostname && parsed.path) {
                config.host = parsed.hostname;
                if (pathIsNotSlash) {
                    config.path = parsed.path;
                }
            }
            else if (pathIsNotSlash) {
                // If hostname isn't set, but path is assume path is the host
                config.host = parsed.path;
            }
        }

        // Take the argument's value, then instance value, then the default value
        ret.token = utils.orByProp("token", config, ret);
        ret.name = utils.orByProp("name", config, ret, defaultConfig);
        ret.level = utils.orByProp("level", config, ret, defaultConfig);

        ret.host = utils.orByProp("host", config, ret, defaultConfig);
        ret.path = utils.orByProp("path", config, ret, defaultConfig);
        ret.protocol = utils.orByProp("protocol", config, ret, defaultConfig);
        ret.port = utils.orByProp("port", config, ret, defaultConfig);
        ret.port = utils.validateNonNegativeInt(ret.port, "Port");
        if (ret.port < 1000 || ret.port > 65535) {
            throw new Error("Port must be an integer between 1000 and 65535, found: " + ret.port);
        }

        ret.maxRetries = utils.orByProp("maxRetries", config, ret, defaultConfig);
        ret.maxRetries = utils.validateNonNegativeInt(ret.maxRetries, "Max retries");

        ret.autoFlush = utils.orByBooleanProp("autoFlush", config, this.config, defaultConfig);

        // If manual batching, don't complain about batch settings from defaultConfig
        if (!ret.autoFlush) {
            ret.maxBatchCount = utils.orByProp("maxBatchCount", config, ret) || 0;
            ret.maxBatchSize = utils.orByProp("maxBatchSize", config, ret) || 0;
            ret.batchInterval = utils.orByProp("batchInterval", config, ret) || 0;
        }
        else {
            ret.maxBatchCount = utils.orByProp("maxBatchCount", config, ret, defaultConfig);
            ret.maxBatchSize = utils.orByProp("maxBatchSize", config, ret, defaultConfig);
            ret.batchInterval = utils.orByProp("batchInterval", config, ret, defaultConfig);
        }

        ret.maxBatchCount = utils.validateNonNegativeInt(ret.maxBatchCount, "Max batch count");
        ret.maxBatchSize = utils.validateNonNegativeInt(ret.maxBatchSize, "Max batch size");
        ret.batchInterval = utils.validateNonNegativeInt(ret.batchInterval, "Batch interval");

        // Error if autoFlush is off and any batching settings are set
        if (!ret.autoFlush && (ret.batchInterval || ret.maxBatchSize || ret.maxBatchCount)) {
            throw new Error("Autoflush is disabled, cannot configure batching settings.");
        }

        // Has the interval timer not started, and needs to be started?
        var startTimer = !this._timerID && ret.autoFlush && ret.batchInterval > 0;
        // Has the interval timer already started, and the interval changed to a different duration?
        var changeTimer = this._timerID && ret.autoFlush && this._timerDuration !== ret.batchInterval && ret.batchInterval > 0;
        
        // Upsert the timer
        if (startTimer || changeTimer) {
            this._enableTimer(ret.batchInterval);
        }
        // Disable timer - there is currently a timer, but config says we no longer need a timer
        else if (this._timerID && (this._timerDuration < 0 || !ret.autoFlush)) {
            this._disableTimer();
        }
    }
    return ret;
};

/**
 * Initializes request options.
 *
 * @param {object} config
 * @param {object} options - Options to pass to <code>{@link https://github.com/request/request#requestpost|request.post()}</code>.
 * See the {@link http://github.com/request/request|request documentation} for all available options.
 * @returns {object} requestOptions
 * @private
 */
SplunkLogger.prototype._initializeRequestOptions = function(options) {
    var ret = utils.copyObject(options || defaultRequestOptions);

    if (options) {
        ret.json = options.hasOwnProperty("json") ? options.json : defaultRequestOptions.json;
        ret.strictSSL = options.strictSSL || defaultRequestOptions.strictSSL;
    }

    ret.headers = ret.headers || {};

    return ret;
};

/**
 * Throws an error if message is <code>undefined</code> or <code>null</code>.
 *
 * @private
 * @throws Will throw an error if the <code>message</code> parameter is malformed.
 */
SplunkLogger.prototype._validateMessage = function(message) {
    if (typeof message === "undefined" || message === null) {
        throw new Error("Message argument is required.");
    }
    return message;
};

/**
 * Initialized metadata, if <code>context.metadata</code> is falsey or empty,
 * return an empty object.
 *
 * @param {object} context
 * @returns {object} metadata
 * @private
 */
SplunkLogger.prototype._initializeMetadata = function(context) {
    var metadata = {};
    if (context && context.hasOwnProperty("metadata")) {
        if (context.metadata.hasOwnProperty("time")) {
            metadata.time = context.metadata.time;
        }
        if (context.metadata.hasOwnProperty("host")) {
            metadata.host = context.metadata.host;
        }
        if (context.metadata.hasOwnProperty("source")) {
            metadata.source = context.metadata.source;
        }
        if (context.metadata.hasOwnProperty("sourcetype")) {
            metadata.sourcetype = context.metadata.sourcetype;
        }
        if (context.metadata.hasOwnProperty("index")) {
            metadata.index = context.metadata.index;
        }
    }
    return metadata;
};

/**
 * Initializes a context object.
 *
 * @param context
 * @returns {object} context
 * @throws Will throw an error if the <code>context</code> parameter is malformed.
 * @private
 */
SplunkLogger.prototype._initializeContext = function(context) {
    if (!context) {
        throw new Error("Context argument is required.");
    }
    else if (typeof context !== "object") {
        throw new Error("Context argument must be an object.");
    }
    else if (!context.hasOwnProperty("message")) {
        throw new Error("Context argument must have the message property set.");
    }

    context.message = this._validateMessage(context.message);

    context.severity = context.severity || defaultConfig.level;

    context.metadata = context.metadata || this._initializeMetadata(context);

    return context;
};

/**
 * Takes anything and puts it in a JS object for the event/1.0 Splunk HTTP Event Collector format.
 *
 * @param {object} context
 * @returns {object}
 * @private
 * @throws Will throw an error if the <code>context</code> parameter is malformed.
 */
SplunkLogger.prototype._makeBody = function(context) {
    if (!context) {
        throw new Error("Context parameter is required.");
    }

    var body = this._initializeMetadata(context);
    var time = utils.formatTime(body.time || Date.now());
    body.time = time.toString();
    
    body.event = this.eventFormatter(context.message, context.severity || defaultConfig.level);
    return body;
};

/**
 * Makes an HTTP POST to the configured server.
 *
 * @param requestOptions
 * @param {function} callback = A callback function: <code>function(err, response, body)</code>.
 * @private
 */
SplunkLogger.prototype._post = function(requestOptions, callback) {
    request.post(requestOptions, callback);
};

/**
 * Sends events to Splunk, optionally with retries on non-Splunk errors.
 *
 * @param context
 * @param {function} callback - A callback function: <code>function(err, response, body)</code>
 * @private
 */
SplunkLogger.prototype._sendEvents = function(context, callback) {
    callback = callback || /* istanbul ignore next*/ function(){};

    // Initialize the config once more to avoid undefined vals below
    this.config = this._initializeConfig(this.config);

    // Makes a copy of the request options so we can set the body
    var requestOptions = this._initializeRequestOptions(this.requestOptions);
    requestOptions.body = this._validateMessage(context.message);
    requestOptions.headers["Authorization"] = "Splunk " + this.config.token;
    // Manually set the content-type header for batched requests, default is application/json
    // since json is set to true.
    requestOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
    requestOptions.url = this.config.protocol + "://" + this.config.host + ":" + this.config.port + this.config.path;


    // Initialize the context again, right before using it
    context = this._initializeContext(context);

    var that = this;

    var splunkError = null; // Errors returned by Splunk
    var requestError = null; // Any non-Splunk errors

    // References so we don't have to deal with callback parameters
    var _response = null;
    var _body = null;

    var numRetries = 0;

    utils.whilst(
        function() {
            // Continue if we can (re)try
            return numRetries++ <= that.config.maxRetries;
        },
        function(done) {
            that._post(requestOptions, function(err, resp, body) {
                // Store the latest error, response & body
                splunkError = null;
                requestError = err;
                _response = resp;
                _body = body;

                // Try to parse an error response from Splunk
                if (!requestError && body && body.code.toString() !== "0") {
                    splunkError = new Error(body.text);
                    splunkError.code = body.code;
                }

                // Retry if no Splunk error, a non-200 request response, and numRetries hasn't exceeded the limit
                if (!splunkError && requestError && numRetries <= that.config.maxRetries) {
                    utils.expBackoff({attempt: numRetries}, done);
                }
                else {
                    // Stop iterating
                    done(true);
                }
            });
        },
        function() {
            // Call error() for a request error or Splunk error
            if (requestError || splunkError) {
                that.error(requestError || splunkError, context);
            }

            callback(requestError, _response, _body);
        }
    );
};
 
/**
 * Sends or queues data to be sent based on <code>this.config.autoFlush</code>.
 * Default behavior is to send immediately.
 *
 * @example
 * var SplunkLogger = require("splunk-logging").Logger;
 * var config = {
 *     token: "your-token-here"
 * }; 
 * 
 * var logger = new SplunkLogger(config);
 *
 * // Payload to send to Splunk's Event Collector
 * var payload = {
 *     message: {
 *         temperature: "70F",
 *         chickenCount: 500
 *     },
 *     severity: "info",
 *     {
 *         source: "chicken coop",
 *         sourcetype: "httpevent",
 *         index: "main",
 *         host: "farm.local",
 *     }
 * }; 
 *
 * // The callback is only used if autoFlush is set to false.
 * logger.send(payload, function(err, resp, body) {
 *     if (err) {
 *         console.log("error:", err);
 *     }
 *     // If successful, body will be { text: 'Success', code: 0 }
 *     console.log("body", body);
 * });
 *
 * @param {object} context - An object with at least the <code>data</code> property.
 * @param {(object|string|Array|number|bool)} context.message - Data to send to Splunk.
 * @param {string} [context.severity=info] - Severity level of this event.
 * @param {object} [context.metadata] - Metadata for this event.
 * @param {string} [context.metadata.host] - If not specified, Splunk will decide the value.
 * @param {string} [context.metadata.index] - The Splunk index to send data to.
 * If not specified, Splunk will decide the value.
 * @param {string} [context.metadata.source] - If not specified, Splunk will decide the value.
 * @param {string} [context.metadata.sourcetype] - If not specified, Splunk will decide the value.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>.
 * @throws Will throw an error if the <code>context</code> parameter is malformed.
 * @public
 */
SplunkLogger.prototype.send = function(context, callback) {
    context = this._initializeContext(context);
    
    // Store the context, and its estimated length
    this.contextQueue.push(context);
    this.eventsBatchSize += Buffer.byteLength(JSON.stringify(this._makeBody(context)), "utf8");

    var batchOverSize = this.eventsBatchSize > this.config.maxBatchSize && this.config.maxBatchSize > 0;
    var batchOverCount = this.contextQueue.length >= this.config.maxBatchCount && this.config.maxBatchCount > 0;

    // Only flush if not using manual batching, and if the contextQueue is too large or has many events
    if (this.config.autoFlush && (batchOverSize || batchOverCount)) {
        this.flush(callback || function(){});
    }
};

/**
 * Manually send all events in <code>this.contextQueue</code> to Splunk.
 *
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>.
 * @public
 */
SplunkLogger.prototype.flush = function(callback) {
    callback = callback || function(){};

    var context = {};

    // Empty the queue, reset the eventsBatchSize
    var queue = this.contextQueue;
    this.contextQueue = [];
    this.eventsBatchSize = 0;
    var data = "";
    for (var i = 0; i < queue.length; i++) {
        data += JSON.stringify(this._makeBody(queue[i]));
    }
    context.message = data;
    this._sendEvents(context, callback);
};

module.exports = SplunkLogger;