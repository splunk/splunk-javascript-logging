var utils = require("./utils");
var request = require("request");
var url = require("url");

/**
 * Default error handler for <code>SplunkLogger</code>.
 * Prints the <code>err</code> and <code>context</code> to console.
 *
 * @param {Error|string} err - The error message, or an <code>Error</code> object.
 * @param {object} [context] - The <code>context</code> of an event.
 * @private
 */
function _err(err, context) {
    console.log("ERROR:", err, " CONTEXT", context);
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
 *     batching: SplunkLogging.Logger.batchingModes.MANUAL
 * };
 *
 * var logger = new SplunkLogger(config);
 *
 * @property {object} config - Configuration settings for this <code>SplunkLogger</code> instance.
 * @property {function[]} middlewares - Middleware functions to run before sending data to Splunk. See {@link SplunkLogger#use}
 * @property {object[]} contextQueue - Queue of <code>context</code> objects to be sent to Splunk.
 * @property {function} error - A callback function for errors: <code>function(err, context)</code>.
 * Defaults to <code>console.log</code> both values;
 *
 * @param {object} config - Configuration settings for a new [SplunkLogger]{@link SplunkLogger}.
 * @param {string} config.token - Splunk HTTP Event Collector token, required.
 * @param {string} [config.name=splunk-javascript-logging/0.8.0] - Name for this logger.
 * @param {string} [config.host=localhost] - Hostname or IP address of Splunk server.
 * @param {string} [config.path=/services/collector/event/1.0] - URL path to send data to on the Splunk server.
 * @param {string} [config.protocol=https] - Protocol used to communicate with the Splunk server, <code>http</code> or <code>https</code>.
 * @param {number} [config.port=8088] - HTTP Event Collector port on the Splunk server.
 * @param {string} [config.url] - URL string to pass to {@link https://nodejs.org/api/url.html#url_url_parsing|url.parse}. This will try to set
 * <code>host</code>, <code>path</code>, <code>protocol</code>, <code>port</code>, <code>url</code>. Any of these values will be overwritten if 
 * the corresponding property is set on <code>config</code>.
 * @param {string} [config.level=info] - Logging level to use, will show up as the <code>severity</code> field of an event, see
 *  [SplunkLogger.levels]{@link SplunkLogger#levels} for common levels.
 * @param {string} [config.batching=off] - Batching mode for sending events, see [SplunkLogger.batchingModes]{@link SplunkLogger#batchingModes}
 *  for valid modes.
 * @constructor
 * @throws Will throw an error if the <code>config</code> parameter is malformed.
 */
var SplunkLogger = function(config) {
    this.config = this._initializeConfig(config);
    this.middlewares = [];
    this.contextQueue = [];
    this.error = _err;
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

/**
 * Enum for batching modes.
 *
 * @default off
 * @readonly
 * @enum {string}
 */
SplunkLogger.prototype.batchingModes = {
    /** No batching. Make a request to Splunk every time <code>send()</code> is called. */
    OFF: "off",
    /** Events are manually batched. Invoke <code>flush()</code> manually to send all queued events in 1 request. */
    MANUAL: "manual"
};

var defaultConfig = {
    name: "splunk-javascript-logging/0.8.0",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    port: 8088,
    level: SplunkLogger.prototype.levels.INFO,
    batching: SplunkLogger.prototype.batchingModes.OFF
};

// TODO: add useragent header?
var defaultRequestOptions = {
    json: true, // Sets the content-type header to application/json
    strictSSL: false,
    url: defaultConfig.protocol + "://" + defaultConfig.host + ":" + defaultConfig.port + defaultConfig.path
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
    var ret = {};
    for (var key in this.config) {
        if (this.config.hasOwnProperty(key)) {
            ret[key] = this.config[key];
        }
    }

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
            if (parsed.protocol) {
                config.protocol = parsed.protocol.replace(":", "");
            }
            if (parsed.port) {
                config.port = parsed.port;
            }
            if (parsed.hostname && parsed.path) {
                config.host = parsed.hostname;
                config.path = parsed.path;
            }
            else if (parsed.path) {
                // If hostname isn't set, but path is assume path is the host
                config.host = parsed.path;
            }
        }

        // Take the argument's value, then instance value, then the default value
        ret.token = config.token || ret.token;
        ret.name = config.name || ret.name || defaultConfig.name;
        ret.host = config.host || ret.host || defaultConfig.host;
        ret.path = config.path || ret.path || defaultConfig.path;
        ret.protocol = config.protocol || ret.protocol || defaultConfig.protocol;
        ret.level = config.level || ret.level || defaultConfig.level;
        ret.batching = config.batching || ret.batching || defaultConfig.batching;

        if (!config.hasOwnProperty("port")) {
            ret.port = ret.port || defaultConfig.port;
        }
        else {
            ret.port = parseInt(config.port, 10);
            if (isNaN(ret.port)) {
                throw new Error("Port must be an integer, found: " + ret.port);
            }
        }
        if (ret.port < 1000 || ret.port > 65535) {
            throw new Error("Port must be an integer between 1000 and 65535, found: " + ret.port);
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
SplunkLogger.prototype._initializeRequestOptions = function(config, options) {
    var ret = {};
    for (var key in defaultRequestOptions) {
        if (defaultRequestOptions.hasOwnProperty(key)) {
            ret[key] = defaultRequestOptions[key];
        }
    }

    config = config || this.config || defaultConfig;
    options = options || ret;

    ret.url = config.protocol + "://" + config.host + ":" + config.port + config.path;
    ret.json = options.hasOwnProperty("json") ? options.json : ret.json;
    ret.strictSSL = options.strictSSL || ret.strictSSL;
    ret.headers = options.headers || {};
    if (config.token) {
        ret.headers.Authorization = "Splunk " + config.token;
    }

    return ret;
};

/**
 * Throws an error if data is <code>undefined</code> or <code>null</code>.
 *
 * @private
 * @throws Will throw an error if the <code>data</code> parameter is malformed.
 */
SplunkLogger.prototype._initializeData = function(data) {
    if (typeof data === "undefined" || data === null) {
        throw new Error("Data argument is required.");
    }
    return data;
};

/**
 * Initializes a context.
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
    else if (!context.hasOwnProperty("data")) {
        throw new Error("Context argument must have the data property set.");
    }

    // _initializeConfig will throw an error config or this.config is
    //     undefined, or doesn't have at least the token property set
    context.config = this._initializeConfig(context.config || this.config);

    context.requestOptions = this._initializeRequestOptions(context.config, context.requestOptions);

    context.data = this._initializeData(context.data);

    context.severity = context.severity || SplunkLogger.prototype.levels.INFO;

    return context;
};

/**
 * Takes anything and puts it in a JS object for the event/1.0 Splunk HTTP Event Collector format.
 *
 * @param {object} context
 * @returns {{time: string, event: {message: *, severity: (string|SplunkLogger.levels)}}}
 * @private
 * @throws Will throw an error if the <code>context</code> parameter is malformed.
 */
SplunkLogger.prototype._makeBody = function(context) {
    if (!context) {
        throw new Error("Context parameter is required.");
    }

    var time = utils.formatTime(context.time || Date.now());
    
    var body = {
        time: time.toString(),
        // Here, we force the data into an object under the message property
        event: {
            message: context.data,
            severity: context.severity || SplunkLogger.prototype.levels.INFO
        }
    };

    // If these properties aren't set, let Splunk set them
    if (context.host) {
        body.host = context.host;
    }
    if (context.source) {
        body.source = context.source;
    }
    if (context.sourcetype) {
        body.sourcetype = context.sourcetype;
    }
    if (context.index) {
        body.index = context.index;
    }
    
    return body;
};

/**
 * Adds an express-like middleware function to run before sending the
 * data to Splunk.
 * Multiple middleware functions can be used, they will be executed
 * in the order they are added.
 *
 * This function is a wrapper around <code>this.middlewares.push()</code>.
 *
 * @example
 * var SplunkLogger = require("splunk-logging").Logger;
 *
 * var Logger = new SplunkLogger({token: "your-token-here"});
 * Logger.use(function(context, next) {
 *     context.data.additionalProperty = "Add this before sending the data";
 *     next(null, context);
 * });
 *
 * @param {function} middleware - A middleware function: <code>function(context, next){}</code>.
 * It must call <code>next(error, context)</code> to continue.
 * @public
 * @throws Will throw an error if <code>middleware</code> is not a <code>function</code>.
 */
SplunkLogger.prototype.use = function(middleware) {
    if (!middleware || typeof middleware !== "function") {
        throw new Error("Middleware must be a function.");
    }
    else {
        this.middlewares.push(middleware);
    }
};

/**
 * Makes an HTTP POST to the configured server.
 *
 * @param context
 * @param {function} callback - A callback function: <code>function(err, response, body)</code>
 * @private
 */
SplunkLogger.prototype._sendEvents = function(context, callback) {
    callback = callback || /* istanbul ignore next*/ function(){};

    // Validate the context again, right before using it
    context = this._initializeContext(context);
    context.requestOptions.headers["Authorization"] = "Splunk " + context.config.token;

    switch(context.config.batching) {
        case SplunkLogger.prototype.batchingModes.MANUAL:
            // Don't run _makeBody since we've already done that
            context.requestOptions.body = context.data;
            // Manually set the content-type header for batching, default is application/json
            // since json is set to true.
            context.requestOptions.headers["content-type"] = "application/x-www-form-urlencoded";
            break;
        default:
            context.requestOptions.body = this._makeBody(context);
            break;
    }
    request.post(context.requestOptions, callback);
};

/**
 * Sends or queues data to be sent based on <code>context.config.batching</code>.
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
 *     data: {
 *         temperature: "70F",
 *         chickenCount: 500
 *     },
 *     source: "chicken coop",
 *     sourcetype: "chicken feeder",
 *     index: "main",
 *     host: "farm.local",
 *     severity: "info"
 * }; 
 *
 * logger.send(payload, function(err, resp, body) {
 *     if (err) {
 *         console.log("error:", err);
 *     }
 *     console.log("body", body); // body { text: 'Success', code: 0 }
 * });
 *
 * @param {object} context - An object with at least the <code>data</code> property.
 * @param {(object|string|Array|number|bool)} context.data - Data to send to Splunk.
 * @param {object} [context.requestOptions] - Additional options to pass to <code>{@link https://github.com/request/request#requestpost|request.post()}</code>.
 * See the {@link http://github.com/request/request|request documentation} for all available options.
 * @param {string} [context.severity=info] - Severity level of this event.
 * @param {object} [context.config] - See {@link SplunkLogger} for default values.
 * @param {string} [context.host] - If not specified, Splunk will decide the value.
 * @param {string} [context.index] - The token set in <code>config.token</code> must be configured to send to this <code>index</code>.
 * If not specified, Splunk will decide the value.
 * @param {string} [context.source] - If not specified, Splunk will decide the value.
 * @param {string} [context.sourcetype] - If not specified, Splunk will decide the value.
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>.
 * @throws Will throw an error if the <code>context</code> parameter is malformed.
 * @public
 */
SplunkLogger.prototype.send = function (context, callback) {
    callback = callback || function(){};
    context = this._initializeContext(context);
    
    this.contextQueue.push(context);

    switch(context.config.batching) {
        case SplunkLogger.prototype.batchingModes.MANUAL:
            // If batching, this is noop
            callback(null);
            break;
        default:
            // Only send immediately if batching is off
            this.flush(callback);
            break;
    }
};

/**
 * Manually send events in <code>this.contextQueue</code> to Splunk, after
 * chaining any <code>functions</code> in <code>this.middlewares</code>.
 * Batching settings will be used from <code>this.config.batching</code>,
 * ignoring batching settings every on every <code>context</code> in <code>this.contextQueue</code>.
 *
 * @param {function} [callback] - A callback function: <code>function(err, response, body)</code>.
 * @public
 */
SplunkLogger.prototype.flush = function (callback) {
    callback = callback || function(){};

    var context = {};

    // Use the batching setting from this.config
    switch(this.config.batching) {
        case SplunkLogger.prototype.batchingModes.MANUAL:
            // Empty the event queue
            var queue = this.contextQueue;
            this.contextQueue = [];
            var data = "";
            for (var i = 0; i < queue.length; i++) {
                data += JSON.stringify(this._makeBody(queue[i]));
            }
            context.data = data;
            break;

        default:
            // TODO: handle case of multiple events with batching off, flushing fast
            context = this.contextQueue.pop();
            break;
    }
    
    // Initialize the context, then manually set the data
    context = this._initializeContext(context);
    
    // Copy over the middlewares
    var callbacks = [];
    for (var j = 0; j < this.middlewares.length; j++) {
        callbacks[j] = this.middlewares[j];
    }

    // Send the data to the first middleware
    callbacks.unshift(function(cb) {
        cb(null, context);
    });

    // After running all, if any, middlewares send the events
    var that = this;
    utils.chain(callbacks, function(err, passedContext) {
        // Errors from any of the middleware callbacks will fall through to here
        // If the context is modified at any point the error callback will get it also
        // event if next("error"); is called w/o the context parameter!
        // This works because context inside & outside the scope of this function
        // point to the same memory block.
        // The passedContext parameter could be named context to
        // do this automatically, but the || notation adds a bit of clarity.
        if (err) {
            that.error(err, passedContext || context);
        }
        else {
            that._sendEvents(context, callback);
        }
    });
};

module.exports = {
    Logger: SplunkLogger, // TODO: should SplunkLogger be moved to it's own file?
    utils: utils
};