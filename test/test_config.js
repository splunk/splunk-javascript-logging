var SplunkLogger = require("../index");
var assert = require("assert");

describe("SplunkLogger", function() {

    describe("constructor", function () {
        it("should error without config", function() {
            try {
                var logger = new SplunkLogger();
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });
        it("should error with undefined config", function() {
            var config;
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });
        it("should error with null config", function() {
            var config = null;
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });
        it("should error with string config", function() {
            var config = "this is not an object";
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config must be an object.");
            }
        });
        it("should error without a token in config", function() {
            var config = {
                something: "else"
            };
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config object must have a token.");
            }
        });
        it("should error with non-string token in config", function() {
            var config = {
                token: {}
            };
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config token must be a string.");
            }
        });
        it("should error with NaN port", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: "this isn't a port"
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Port must be an integer, found: NaN");
            }
        });
        it("should correctly parse port with leading zero", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: "000000001234"
            };

            var logger = new SplunkLogger(config);
            assert.strictEqual(logger.config.port, 1234);
        });
        it("should correctly parse port < 1000", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 999
            };
            try {
                var logger = new SplunkLogger(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Port must be an integer between 1000 and 65535, found: " + config.port);
            }
        });
        it("should set default config with token only config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(logger.levels.info, logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set non-default boolean config values", function() {
            var config = {
                token: "a-token-goes-here-usually",
                protocol: "http",
                strictSSL: true
            };
            var logger = new SplunkLogger(config);

            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set non-default path", function() {
            var config = {
                token: "a-token-goes-here-usually",
                path: "/something/different/here/1.0"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual(config.path, logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set non-default port", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 1234
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(config.port, logger.config.port);
        });
        it("should set protocol, host, port & path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/services/collector/different/1.0"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/different/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
        });
        it("should set protocol from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http:"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set host from url property with host only", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "splunk.local"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
    });
    
    describe("_initializeConfig", function(){

    });

    describe("_initializeRequestOptions", function() {
        it("should error with no args", function() {
            try {
                SplunkLogger.prototype._initializeRequestOptions();
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });

        it("should create defaults with token in config", function() {
            var config = {
                token: "some-value"
            };
            // Get the defaults because we're passing in a config
            config = SplunkLogger.prototype._initializeConfig(config);

            var options = SplunkLogger.prototype._initializeRequestOptions(config);
            assert.ok(options);
            assert.strictEqual(options.url, "https://localhost:8088/services/collector/event/1.0");
            assert.ok(options.headers);
            assert.ok(options.headers.hasOwnProperty("Authorization"));
            assert.ok(options.headers.Authorization, "Splunk " + config.token);
            assert.strictEqual(options.json, true);
            assert.strictEqual(options.strictSSL, false);
        });
    });

    describe("_initializeSettings", function(){});
});