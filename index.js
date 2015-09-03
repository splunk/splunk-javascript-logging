var utils = require("./utils");
var request = require("request");
var url = require("url");

/**
 * TODO: docs
 * default error handler
 */
function _err(err, context) {
    console.log("ERROR:", err, " CONTEXT", context);
}

/**
 * TODO: docs
 *
 * Constructor
 *
 * Takes an object with keys:
 *     token (required)
 *     host (optional, defaults to localhost)
 *     name (optional, defaults to splunk-javascript-logging)
 *     etc.
 */
var SplunkLogger = function(config) {
    this.config = this._initializeConfig(config);
    this.middlewares = []; // Array of callbacks to run between send and _sendEvents
    this.contextQueue = []; // Queue of contexts
    this.error = _err;
};

/**
 * TODO: docs, do we want to add other levels?
 * 
 */
SplunkLogger.prototype.levels = {
    info: "info"
};

/**
 * TODO: add other batching modes
 *
 * Modes
 *  - off: no batching (default)
 *  - manual: must call flush manually to actually send events
 * 
 */
SplunkLogger.prototype.batchingModes = {
    off: "off",
    manual: "manual"
};

var defaultConfig = {
    name: "splunk-javascript-logging/0.8.0",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    level: SplunkLogger.prototype.levels.info,
    port: 8088,
    batching: SplunkLogger.prototype.batchingModes.off
};

// TODO: add useragent header
var defaultRequestOptions = {
    json: true, // Sets the content-type header to application/json
    strictSSL: false,
    url: defaultConfig.protocol + "://" + defaultConfig.host + ":" + defaultConfig.port + defaultConfig.path
};

/**
 * TODO: docs
 * 
 * validates the config, throwing an error if it's horribly wrong
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
 * TODO: docs
 * 
 * NOTE: This function calls _initializeConfig
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
 * TODO: docs
 *
 */
SplunkLogger.prototype._initializeData = function(data) {
    if (typeof data === "undefined" || data === null) {
        throw new Error("Data argument is required.");
    }
    return data;
};

/**
 * TODO: docs
 * 
 * Takes the context object & tries to initialize the
 * config and request options.
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

    context.severity = context.severity || SplunkLogger.prototype.levels.info;

    return context;
};

/**
 * TODO: docs
 * Takes anything and puts it in a JS object for the event/1.0 EC format
 *
 * TODO: add metadata to the JSON body
 */
SplunkLogger.prototype._makeBody = function(context) {
    // TODO: add time to the metadata

    if (!context) {
        throw new Error("Context parameter is required.");
    }
    
    var body = {
        // Here, we force the data into an object under the message property
        event: {
            message: context.data,
            severity: context.severity || SplunkLogger.prototype.levels.info
        }
    };
    
    return body;
};

/**
 * TODO: docs
 * 
 * Adds a middleware function to run before sending the
 * data to Splunk.
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
 * TODO: docs
 *
 * Makes an HTTP POST to the configured server.
 * Any config not specified will be set to the default configuration.
 */
SplunkLogger.prototype._sendEvents = function(context, callback) {
    callback = callback || /* istanbul ignore next*/ function(){};
    // Validate the context again, right before using it
    context = this._initializeContext(context);
    context.requestOptions.headers["Authorization"] = "Splunk " + context.config.token;

    switch(context.config.batching) {
        case SplunkLogger.prototype.batchingModes.manual:
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
 * TODO: docs
 * Takes config context, anything, & a callback(err, resp, body)
 * 
 */
SplunkLogger.prototype.send = function (context, callback) {
    context = this._initializeContext(context);
    callback = callback || function(){};
    this.contextQueue.push(context);

    switch(context.config.batching) {
        case SplunkLogger.prototype.batchingModes.manual:
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
 * TODO: docs
 *
 * Batching settings will be used from this.config.batching,
 * ignoring any possible this.contextQueue[i].config.batching
 * values.
 * 
 */
SplunkLogger.prototype.flush = function (callback) {
    callback = callback || function(){};

    var context = {};

    // Use the batching setting from this.config
    switch(this.config.batching) {
        case SplunkLogger.prototype.batchingModes.manual:
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
            // TODO: handle case of multiple events with batching off
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

module.exports = SplunkLogger;