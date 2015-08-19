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
    validateConfiguration: function(configuration) {
        if (!configuration) {
            throw new Error("Configuration is required.");
        }
        else if (typeof configuration !== "object") {
            throw new Error("Configuration must be an object.");
        }
        else if (!configuration.hasOwnProperty("token")) {
            throw new Error("Configuration object must have a token.");
        }
        else if (typeof configuration.token !== "string") {
            throw new Error("Configuration token must be a string.");
        }
        else {
            // Specifying the url will override host, port, useHTTPS, & path if possible
            if (configuration.url) {
                var parsed = url.parse(configuration.url);
                if (parsed.protocol) {
                    configuration.useHTTPS = (parsed.protocol === "https:");
                }
                if (parsed.port) {
                    configuration.port = parsed.port;
                }
                if (parsed.hostname && parsed.path) {
                    configuration.host = parsed.hostname;
                    configuration.path = parsed.path;
                }
                else if (parsed.path) {
                    // If hostname isn't set, but path is assume path is the host
                    configuration.host = parsed.path;
                }
            }

            configuration.name = configuration.name || "splunk-javascript-logging/0.8.0";
            configuration.host = configuration.host || "localhost";
            configuration.path = configuration.path || "/services/collector/event/1.0";
            configuration.useHTTPS = configuration.hasOwnProperty("useHTTPS") ? configuration.useHTTPS : true;
            configuration.strictSSL = configuration.hasOwnProperty("strictSSL") ? configuration.strictSSL : false;
            configuration.level = configuration.level || this.levels.info;

            if (!configuration.hasOwnProperty("port")) {
                configuration.port = 8088;
            }
            else {
                configuration.port = parseInt(configuration.port, 10);
                if (isNaN(configuration.port)) {
                    throw new Error("Port must be an integer, found: " + configuration.port);
                }
            }

            return configuration;
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