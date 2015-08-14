var request = require("request");

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
        else if (typeof configuration.token !== "string") {
            throw new Error("Configuration token must be a string.");
        }
        else {
            configuration.name = configuration.name || "splunk-javascript-logging/0.8.0";
            configuration.host = configuration.host || "localhost";
            configuration.url = configuration.url || "/services/collector/event/1.0";
            configuration.useHTTPS = configuration.hasOwnProperty("useHTTPS") ? configuration.useHTTPS : true;
            configuration.strictSSL = configuration.hasOwnProperty("strictSSL") ? configuration.strictSSL : false;
            
            // TODO: Force the info logging level?
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
    sendEvent: function (config, event, callback) {
        var scheme = "https";
        if (config.hasOwnProperty("https") && !config.useHTTPS) {
            scheme = "http";
        }
        var options = {
            url: scheme + "://" + config.host + ":" + config.port + config.url,
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