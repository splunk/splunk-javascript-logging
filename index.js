var request = require("request");

module.exports = {
    /**
     * TODO: docs
     * Takes an object with keys:
     *     token (required)
     *     host (optional, defaults to localhost)
     *     name (optional, defaults to splunk-javascript-logging)
     */
    validateConfiguration: function(configuration) {
        // TODO: do we want to use callbacks here, especially for when conf is invalid?
        if (!configuration) {
            throw new Error("Configuration is required.");
        }
        else if (typeof configuration !== "object") {
            throw new Error("Configuration must be an object.");
        }
        else if (!configuration.hasOwnProperty("token")) {
            throw new Error("Configuration object must have a token.");
        }
        else {
            configuration.name = configuration.name || "splunk-javascript-logging";
            configuration.host = configuration.host || "localhost";
            configuration.useHTTPS = configuration.useHTTPS || true;
            configuration.strictSSL = configuration.strictSSL || false;
            // TODO: Force the info logging level?
            configuration.level = "info";

            // Port - try to parse it as an int, error if it fails
            if (!configuration.hasOwnProperty("port")) {
                configuration.port = configuration.port || 8088;
            }
            else if (isNaN(parseInt(configuration.port, 10))) {
                throw new Error("Port must be an integer, found: " + configuration.port);
            }
            else {
                configuration.port = parseInt(configuration.port, 10) || 8088;    
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
     * Takes config settings, anything, & a callback
     * 
     * Makes an HTTP POST to the configured server
     */
    sendEvent: function (config, event, callback) {
        var pathPrefix = config.useHTTPS ? "https" : "http";
        var pathSuffix = "/services/collector/event/1.0";

        var options = {
            url: pathPrefix + "://" + config.host + ":" + config.port + pathSuffix,
            headers: {
                Authorization: "Splunk " + config.token
            },
            json: true,
            body: this._makeBody(event),
            strictSSL: config.strictSSL
        };

        request.post(options, callback);
    }
};