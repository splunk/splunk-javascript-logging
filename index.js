var utils = require("./utils");
var request = require("request");
var url = require("url");

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
    this.config = this._validateConfig(config);
    this.middlewares = [];
};

/**
 * TODO: docs
 * 
 * validates the config, throwing an error if it's horribly wrong
 */
SplunkLogger.prototype._validateConfig = function(config) {
    var ret = {};
    if (!config) {
        throw new Error("Config is required.");
    }
    else if (typeof config !== "object") {
        throw new Error("Config must be an object.");
    }
    else if (!config.hasOwnProperty("token")) {
        throw new Error("Config object must have a token.");
    }
    else if (typeof config.token !== "string") {
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
        ret.token = config.token;
        ret.name = config.name || "splunk-javascript-logging/0.8.0";
        ret.host = config.host || "localhost";
        ret.path = config.path || "/services/collector/event/1.0";
        ret.protocol = config.protocol || "https";
        ret.strictSSL = config.hasOwnProperty("strictSSL") ? config.strictSSL : false;
        ret.level = config.level || this.levels.info;

        if (!config.hasOwnProperty("port")) {
            ret.port = 8088;
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
 * TODO: docs, do we want to add other levels?
 * 
 */
SplunkLogger.prototype.levels = {
    info: "info"
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
 * Any config not specified will be 
 */
SplunkLogger.prototype._sendEvents = function(config, data, callback) {
    var options = {
        url: config.protocol + "://" + config.host + ":" + config.port + config.path,
        headers: {
            Authorization: "Splunk " + config.token
        },
        json: true,
        body: this._makeBody(data),
        strictSSL: config.strictSSL
    };
    
    request.post(options, callback);
};

/**
 * TODO: docs
 * Takes config settings, anything, & a callback(err, resp, body)
 * 
 */
SplunkLogger.prototype.send = function (config, data, callback) {
    // TODO: handle optional parameters

    // TODO: properly handle config changing "on the fly"
    //     : decide between 3 sources of config (default, this.config & config parameter)
    // Currently, we're ignoring anything set on this.config
    config = this._validateConfig(config);

    // TODO: implement error handling for all middlewares, and _sendEvents

    // Send the data to the first middleware
    var callbacks = this.middlewares;
    callbacks.unshift(function(callback) {
        callback(null, data);
    });

    // After running all, if any, middlewares send the events
    var that = this;
    utils.chain(callbacks, function(err, data) { 
        that._sendEvents(config, data, callback);
    });
};

module.exports = SplunkLogger;