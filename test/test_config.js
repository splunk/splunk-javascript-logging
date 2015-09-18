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

var SplunkLogger = require("../index").Logger;
var assert = require("assert");

describe("SplunkLogger", function() {
    describe("constructor", function () {
        it("should error without config", function() {
            try {
                var logger = new SplunkLogger();
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
                assert.fail(!logger, "Expected an error.");
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
            assert.strictEqual(logger.levels.INFO, logger.config.level);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set remaining defaults when setting config with token, autoFlush off, & level", function() {
            var config = {
                token: "a-token-goes-here-usually",
                level: "important",
                autoFlush: false
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("important", logger.config.level);
            assert.strictEqual(false, logger.config.autoFlush);
            assert.strictEqual(8088, logger.config.port);
        });
        it("should set non-default boolean config values", function() {
            var config = {
                token: "a-token-goes-here-usually",
                protocol: "http",
                strictSSL: true
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
        it("should set everything but path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
        });
        it("should set everything but path from url property with trailing slash", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
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
            assert.strictEqual(true, logger.config.autoFlush);
            assert.strictEqual(8088, logger.config.port);
        });
    });
    describe("_initializeConfig", function() {
        it("should error with no args", function() {
            try {
                SplunkLogger.prototype._initializeConfig();
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });
        it("should error with string config", function() {
            try {
                SplunkLogger.prototype._initializeConfig("not an object");
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config must be an object.");
            }
        });
        it("should error without token in config", function() {
            try {
                var config = {
                    notToken: "value"
                };
                SplunkLogger.prototype._initializeConfig(config);
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config object must have a token.");
            }
        });
        it("should error with non-string token in config", function() {
            try {
                var config = {
                    token: false
                };
                SplunkLogger.prototype._initializeConfig(config);
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
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
                SplunkLogger.prototype._initializeConfig(config);
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

            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);
            assert.strictEqual(loggerConfig.port, 1234);
        });
        it("should correctly parse port < 1000", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 999
            };
            try {
                SplunkLogger.prototype._initializeConfig(config);
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
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
        it("should set non-default boolean config values", function() {
            var config = {
                token: "a-token-goes-here-usually",
                protocol: "http",
                strictSSL: true
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
        it("should set non-default path", function() {
            var config = {
                token: "a-token-goes-here-usually",
                path: "/something/different/here/1.0"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual(config.path, loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
        it("should set non-default port", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 1234
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(config.port, loggerConfig.port);
        });
        it("should set protocol, host, port & path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/services/collector/different/1.0"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/different/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(9088, loggerConfig.port);
        });
        it("should set protocol from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http:"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
        it("should set host from url property with host only", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "splunk.local"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
        it("should ignore prototype values", function() {
            Object.prototype.something = "ignore";
            var config = {
                token: "a-token-goes-here-usually",
                url: "splunk.local"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.ok(!loggerConfig.hasOwnProperty("something"));
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.8.0", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
        });
    });
    describe("_initializeRequestOptions", function() {
        it("should get defaults with no args", function() {
            var options = SplunkLogger.prototype._initializeRequestOptions();
            assert.ok(options);
            assert.strictEqual(options.json, true);
            assert.strictEqual(options.strictSSL, false);
            assert.strictEqual(options.url, "https://localhost:8088/services/collector/event/1.0");
            assert.ok(options.hasOwnProperty("headers"));
            assert.strictEqual(Object.keys(options.headers).length, 0);
            assert.ok(!options.headers.hasOwnProperty("Authorization"));
        });
        it("should create default options with token in config", function() {
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
        it("should create options with full config", function() {
            var config = {
                token: "some-value",
                protocol: "http",
                host: "splunk.local",
                port: 1234,
                path: "/services/collector/custom/1.0"
            };
            config = SplunkLogger.prototype._initializeConfig(config);

            var options = SplunkLogger.prototype._initializeRequestOptions(config);
            assert.ok(options);
            assert.strictEqual(options.url, "http://splunk.local:1234/services/collector/custom/1.0");
            assert.ok(options.headers);
            assert.ok(options.headers.hasOwnProperty("Authorization"));
            assert.ok(options.headers.Authorization, "Splunk " + config.token);
            assert.strictEqual(options.json, true);
            assert.strictEqual(options.strictSSL, false);
        });
        it("should create options with full config, empty options", function() {
            var config = {
                token: "some-value",
                protocol: "http",
                host: "splunk.local",
                port: 1234,
                path: "/services/collector/custom/1.0"
            };
            config = SplunkLogger.prototype._initializeConfig(config);

            var options = SplunkLogger.prototype._initializeRequestOptions(config, {});
            assert.ok(options);
            assert.strictEqual(options.url, "http://splunk.local:1234/services/collector/custom/1.0");
            assert.ok(options.headers);
            assert.ok(options.headers.hasOwnProperty("Authorization"));
            assert.ok(options.headers.Authorization, "Splunk " + config.token);
            assert.strictEqual(options.json, true);
            assert.strictEqual(options.strictSSL, false);
        });

        it("should create options with full config, & full options", function() {
            var config = {
                token: "some-value",
                protocol: "http",
                host: "splunk.local",
                port: 1234,
                path: "/services/collector/custom/1.0"
            };
            config = SplunkLogger.prototype._initializeConfig(config);

            var initialOptions = {
                json: false,
                strictSSL: true,
                url: "should be overwritten",
                headers: {
                    Custom: "header-value",
                    Authorization: "Should be overwritten"
                }
            };

            var options = SplunkLogger.prototype._initializeRequestOptions(config, initialOptions);
            assert.ok(options);
            assert.strictEqual(options.url, "http://splunk.local:1234/services/collector/custom/1.0");
            assert.ok(options.headers);
            assert.ok(options.headers.hasOwnProperty("Custom"));
            assert.strictEqual(options.headers.Custom, initialOptions.headers.Custom);
            assert.ok(options.headers.hasOwnProperty("Authorization"));
            assert.ok(options.headers.Authorization, "Splunk " + config.token);
            assert.strictEqual(options.json, false);
            assert.strictEqual(options.strictSSL, true);
        });
        it("should create default options with token in config", function() {
            Object.prototype.someproperty = "ignore";
            var config = {
                token: "some-value"
            };
            // Get the defaults because we're passing in a config
            config = SplunkLogger.prototype._initializeConfig(config);

            var options = SplunkLogger.prototype._initializeRequestOptions(config);
            assert.ok(options);
            assert.ok(!options.hasOwnProperty("someproperty"));
            assert.strictEqual(options.url, "https://localhost:8088/services/collector/event/1.0");
            assert.ok(options.headers);
            assert.ok(options.headers.hasOwnProperty("Authorization"));
            assert.ok(options.headers.Authorization, "Splunk " + config.token);
            assert.strictEqual(options.json, true);
            assert.strictEqual(options.strictSSL, false);
        });
    });
    describe("_initializeMessage", function() {
        it("should error with no args", function() {
            try {
                SplunkLogger.prototype._initializeMessage();
                assert.ok(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Message argument is required.");
            }
        });
        it("should leave string intact", function() {
            var beforeMessage = "something";
            var afterMessage = SplunkLogger.prototype._initializeMessage(beforeMessage);
            assert.ok(afterMessage);
            assert.strictEqual(afterMessage, beforeMessage);
        });
    });
    describe("_initializeContext", function() {
        it("should error with no args", function() {
            try {
                SplunkLogger.prototype._initializeContext();
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Context argument is required.");
            }
        });
        it("should error with non-object context", function() {
            try {
                SplunkLogger.prototype._initializeContext("not an object");
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Context argument must be an object.");
            }
        });
        it("should error with non-object context", function() {
            try {
                SplunkLogger.prototype._initializeContext({});
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Context argument must have the message property set.");
            }
        });
        it("should error with data only", function() {
            try {
                var context = {
                    message: "something"
                };
                SplunkLogger.prototype._initializeContext(context);
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Config is required.");
            }
        });
        it("should succeed with default context, specifying data & config token", function() {
            var context = {
                message: "some data",
                config: {
                    token: "a-token-goes-here-usually"
                }
            };

            var initialized = SplunkLogger.prototype._initializeContext(context);
            var data = initialized.message;
            var config = initialized.config;
            var requestOptions = initialized.requestOptions;

            assert.ok(initialized);
            assert.ok(data);
            assert.strictEqual(data, context.message);

            assert.ok(config);
            assert.strictEqual(config.token, context.config.token);
            assert.strictEqual(config.name, "splunk-javascript-logging/0.8.0");
            assert.strictEqual(config.host, "localhost");
            assert.strictEqual(config.path, "/services/collector/event/1.0");
            assert.strictEqual(config.protocol, "https");
            assert.strictEqual(config.level, "info");
            assert.strictEqual(config.port, 8088);

            assert.ok(requestOptions);
            assert.strictEqual(requestOptions.json, true);
            assert.strictEqual(requestOptions.strictSSL, false);
            assert.strictEqual(requestOptions.url, "https://localhost:8088/services/collector/event/1.0");
            assert.ok(requestOptions.hasOwnProperty("headers"));
            assert.strictEqual(Object.keys(requestOptions.headers).length, 1);
            assert.strictEqual(requestOptions.headers.Authorization, "Splunk " + context.config.token);
        });
    });
    describe("constructor + _initializeConfig", function() {
        it("token in constructor, then init with empty config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var expected = {
                token: config.token,
                name: "splunk-javascript-logging/0.8.0",
                host: "localhost",
                path: "/services/collector/event/1.0",
                protocol: "https",
                level: "info",
                port: 8088
            };

            var Logger = new SplunkLogger(config);
            assert.ok(Logger.config);
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
            assert.strictEqual(Logger.middlewares.length, 0);

            Logger._initializeConfig({});
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
            assert.strictEqual(Logger.middlewares.length, 0);
        });
        it("token in constructor, then init with full config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var expected = {
                token: config.token,
                name: "splunk-javascript-logging/0.8.0",
                host: "localhost",
                path: "/services/collector/event/1.0",
                protocol: "https",
                level: "info",
                port: 8088
            };

            var Logger = new SplunkLogger(config);
            assert.ok(Logger.config);
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
            assert.strictEqual(Logger.middlewares.length, 0);

            expected.token = "a-different-token";
            Logger.config = Logger._initializeConfig(expected);
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
            assert.strictEqual(Logger.middlewares.length, 0);
        });
    });
});
