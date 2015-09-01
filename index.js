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
    this.middlewares = [];
    this.error = _err;
};

/**
 * TODO: docs, do we want to add other levels?
 * 
 */
SplunkLogger.prototype.levels = {
    info: "info"
};


var defaultConfig = {
    name: "splunk-javascript-logging/0.8.0",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    level: SplunkLogger.prototype.levels.info,
    port: 8088
};

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

    return context;
};

/**
 * TODO: docs
 * Takes anything and puts it in a JS object for the event/1.0 EC format
 *
 * TODO: add metadata to the JSON body
 */
SplunkLogger.prototype._makeBody = function(event) {
    var body = {
        event: event
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
    // Validate the context again, right before using them
    context = this._initializeContext(context);
    context.requestOptions.headers["Authorization"] = "Splunk " + context.config.token;
    context.requestOptions.body = this._makeBody(context.data);

    request.post(context.requestOptions, callback);
};

/**
 * TODO: docs
 * Takes config context, anything, & a callback(err, resp, body)
 * 
 */
SplunkLogger.prototype.send = function (context, callback) {
    // Validate the context
    context = this._initializeContext(context);

    // Send the data to the first middleware
    var callbacks = this.middlewares;
    callbacks.unshift(function(callback) {
        callback(null, context);
    });

    // After running all, if any, middlewares send the events
    var that = this;
    utils.chain(callbacks, function(err) {
        // Errors from any of the middleware callbacks will fall through to here
        if (err) {
            // TODO: how can I extract the context from a middleware?
            that.error(err, context);
        }
        else {
            that._sendEvents(context, callback);
        }
    });
};

module.exports = SplunkLogger;