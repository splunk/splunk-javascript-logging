var request = require("request");
var url = require("url");

module.exports = {
    /**
     * TODO: docs
     */
    levels: {
        info: "info"
    },
    /**
     * TODO: docs
     * Takes an object with keys:
     *     token (required)
     *     host (optional, defaults to localhost)
     *     name (optional, defaults to splunk-javascript-logging)
     */
    validateConfig: function(config) {
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
            // Specifying the url will override host, port, useHTTPS, & path if possible
            if (config.url) {
                var parsed = url.parse(config.url);
                if (parsed.protocol) {
                    config.useHTTPS = (parsed.protocol === "https:");
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

            config.name = config.name || "splunk-javascript-logging/0.8.0";
            config.host = config.host || "localhost";
            config.path = config.path || "/services/collector/event/1.0";
            config.useHTTPS = config.hasOwnProperty("useHTTPS") ? config.useHTTPS : true;
            config.strictSSL = config.hasOwnProperty("strictSSL") ? config.strictSSL : false;
            config.level = config.level || this.levels.info;

            if (!config.hasOwnProperty("port")) {
                config.port = 8088;
            }
            else {
                config.port = parseInt(config.port, 10);
                if (isNaN(config.port)) {
                    throw new Error("Port must be an integer, found: " + config.port);
                }
            }

            return config;
        }
    },
    /**
     * TODO: docs
     * Takes anything and puts it in a JS object
     *
     * TODO: add metadata to the JSON body
     */
    _makeBody: function (event) {
        var body = {
            event: event
        };
        return body;
    },
    /**
     * TODO: docs
     * Takes config settings, anything, & a callback(err, resp, body)
     * 
     * Makes an HTTP POST to the configured server
     */
    send: function (config, data, callback) {
        var scheme = "https";
        if (config.hasOwnProperty("https") && !config.useHTTPS) {
            scheme = "http";
        }
        // TODO: move the request out of this function
        var options = {
            url: scheme + "://" + config.host + ":" + config.port + config.path,
            headers: {
                Authorization: "Splunk " + config.token
            },
            json: true,
            body: this._makeBody(data),
            strictSSL: config.strictSSL
        };

        request.post(options, callback);
    }
};
