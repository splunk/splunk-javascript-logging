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
var https = require("https");

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
                assert.strictEqual(err.message, "Port must be a number, found: NaN");
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
        it("should error parsing port < 1", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 0
            };
            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Port must be an integer between 1 and 65535, found: " + config.port);
            }
        });
        it("should correctly parse 1 < port < 1000", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 999
            };
            var logger = new SplunkLogger(config);
            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(logger.levels.INFO, logger.config.level);
            assert.strictEqual(999, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
            assert.strictEqual(0, logger.config.batchInterval);
            assert.strictEqual(0, logger.config.maxBatchSize);
        });
        it("should set default config with token only config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(logger.levels.INFO, logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
            assert.strictEqual(0, logger.config.batchInterval);
            assert.strictEqual(0, logger.config.maxBatchSize);

            var expected = {
                json: false,
                strictSSL: false,
                headers: {}
            };
            assert.ok(logger.hasOwnProperty("requestOptions"));
            assert.strictEqual(Object.keys(logger.requestOptions).length, 3);
            assert.strictEqual(expected.json, logger.requestOptions.json);
            assert.strictEqual(expected.strictSSL, logger.requestOptions.strictSSL);
            assert.strictEqual(Object.keys(expected.headers).length, Object.keys(logger.requestOptions.headers).length);
        });
        it("should set remaining defaults when setting config with token, batching off, & level", function() {
            var config = {
                token: "a-token-goes-here-usually",
                level: "important"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("important", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should error when _enableTimer(NaN)", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            try {
                var logger = new SplunkLogger(config);
                logger._enableTimer("not a number");
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Batch interval must be a number, found: NaN", err.message);
            }
        });
        it("should error when batchInterval=NaN", function() {
            var config = {
                token: "a-token-goes-here-usually",
                batchInterval: "not a number",
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Batch interval must be a number, found: NaN", err.message);
            }
        });
        it("should error when batchInterval is negative", function() {
            var config = {
                token: "a-token-goes-here-usually",
                batchInterval: -1,
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Batch interval must be a positive number, found: -1", err.message);
            }
        });
        it("should change the timer via _enableTimer()", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var logger = new SplunkLogger(config);
            logger._enableTimer(1);
            assert.strictEqual(logger._timerDuration, 1);
            logger._enableTimer(2);
            assert.strictEqual(logger._timerDuration, 2);
            logger._disableTimer();
        });
        // TODO: fix this test
        it("should disable the timer via _initializeConfig()", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var logger = new SplunkLogger(config);
            logger._enableTimer(1);
            assert.strictEqual(logger._timerDuration, 1);
            logger._enableTimer(2);
            assert.strictEqual(logger._timerDuration, 2);

            logger.config.batchInterval = 0;
            logger.config.maxBatchCount = 0;

            logger._initializeConfig(logger.config);
            assert.ok(!logger._timerDuration);
            assert.ok(!logger._timerID);
        });
        it("should be noop when _disableTimer() is called when no timer is configured", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var logger = new SplunkLogger(config);
            var old = logger._timerDuration;
            assert.ok(!logger._timerDuration);
            logger._disableTimer();
            assert.ok(!logger._timerDuration);
            assert.strictEqual(logger._timerDuration, old);
        });
        it("should set a batch interval timer with batching on, & batchInterval set", function() {
            var config = {
                token: "a-token-goes-here-usually",
                batchInterval: 100
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.ok(logger._timerID);

            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(100, logger.config.batchInterval);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should not set a batch interval timer with batching on, & default batchInterval", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.ok(!logger._timerID);

            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(0, logger.config.batchInterval);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should error when maxBatchCount=NaN", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxBatchCount: "not a number",
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Max batch count must be a number, found: NaN", err.message);
            }
        });
        it("should error when maxBatchCount is negative", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxBatchCount: -1,
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Max batch count must be a positive number, found: -1", err.message);
            }
        });
        it("should error when maxBatchSize=NaN", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxBatchSize: "not a number",
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Max batch size must be a number, found: NaN", err.message);
            }
        });
        it("should error when maxBatchSize is negative", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxBatchSize: -1,
            };

            try {
                var logger = new SplunkLogger(config);
                assert.fail(!logger, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual("Max batch size must be a positive number, found: -1", err.message);
            }
        });
        it("should set non-default boolean config values", function() {
            var config = {
                token: "a-token-goes-here-usually",
                protocol: "http",
                strictSSL: true
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.ok(!logger._timerID);

            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set non-default path", function() {
            var config = {
                token: "a-token-goes-here-usually",
                path: "/something/different/here/1.0"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual(config.path, logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set non-default port", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 1234
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(config.port, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set non-default maxBatchSize", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxBatchSize: 1234
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
            assert.strictEqual(1234, logger.config.maxBatchSize);
        });
        it("should set protocol, host, port & path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/services/collector/different/1.0"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/different/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set protocol from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http:"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set everything but path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set everything but path from url property with trailing slash", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("http", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(9088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set host from url property with host only", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "splunk.local"
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("splunk.local", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(0, logger.config.maxRetries);
        });
        it("should set maxRetries", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxRetries: 10
            };
            var logger = new SplunkLogger(config);

            assert.ok(logger);
            assert.strictEqual(config.token, logger.config.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", logger.config.name);
            assert.strictEqual("localhost", logger.config.host);
            assert.strictEqual("/services/collector/event/1.0", logger.config.path);
            assert.strictEqual("https", logger.config.protocol);
            assert.strictEqual("info", logger.config.level);
            assert.strictEqual(8088, logger.config.port);
            assert.strictEqual(10, logger.config.maxRetries);
        });
        it("should accept requestOptions", function () {
            var config = {
                token: "a-token-goes-here-usually",
            };
            var requestOptions = {
                agent: new https.Agent()
            };
            var logger = new SplunkLogger(config, requestOptions);

            assert.ok(logger);
            assert.ok(logger.requestOptions.agent instanceof https.Agent);
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
        it("should error with NaN maxRetries", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxRetries: "this isn't a number"
            };

            try {
                SplunkLogger.prototype._initializeConfig(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Max retries must be a number, found: NaN");
            }
        });
        it("should error with negative maxRetries", function() {
            var config = {
                token: "a-token-goes-here-usually",
                maxRetries: -1
            };

            try {
                SplunkLogger.prototype._initializeConfig(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Max retries must be a positive number, found: -1");
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
                assert.strictEqual(err.message, "Port must be a number, found: NaN");
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
        it("should correctly parse port < 1", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 0
            };
            try {
                SplunkLogger.prototype._initializeConfig(config);
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Port must be an integer between 1 and 65535, found: " + config.port);
            }
        });
        it("should correctly parse 1 < port < 1000", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 999
            };

            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(999, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set default config with token only config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set non-default boolean config values", function() {
            var config = {
                token: "a-token-goes-here-usually",
                protocol: "http",
                strictSSL: true
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set non-default path", function() {
            var config = {
                token: "a-token-goes-here-usually",
                path: "/something/different/here/1.0"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual(config.path, loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set non-default port", function() {
            var config = {
                token: "a-token-goes-here-usually",
                port: 1234
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(config.port, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set protocol, host, port & path from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http://splunk.local:9088/services/collector/different/1.0"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/different/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(9088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set protocol from url property", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "http:"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("localhost", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("http", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
        it("should set host from url property with host only", function() {
            var config = {
                token: "a-token-goes-here-usually",
                url: "splunk.local"
            };
            var loggerConfig = SplunkLogger.prototype._initializeConfig(config);

            assert.ok(loggerConfig);
            assert.strictEqual(config.token, loggerConfig.token);
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
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
            assert.strictEqual("splunk-javascript-logging/0.11.1", loggerConfig.name);
            assert.strictEqual("splunk.local", loggerConfig.host);
            assert.strictEqual("/services/collector/event/1.0", loggerConfig.path);
            assert.strictEqual("https", loggerConfig.protocol);
            assert.strictEqual("info", loggerConfig.level);
            assert.strictEqual(8088, loggerConfig.port);
            assert.strictEqual(0, loggerConfig.maxRetries);
            assert.strictEqual(0, loggerConfig.batchInterval);
            assert.strictEqual(0, loggerConfig.maxBatchSize);
        });
    });
    describe("_initializeRequestOptions", function() {
        it("should get defaults with no args", function() {
            var options = SplunkLogger.prototype._initializeRequestOptions();
            assert.ok(options);
            assert.ok(Object.keys(options).length, 3);
            assert.strictEqual(options.json, false);
            assert.strictEqual(options.strictSSL, false);
            assert.ok(options.headers);
            assert.strictEqual(Object.keys(options.headers).length, 0);
        });
        it("should get defaults with none of the default props configured", function() {
            var optionsOriginal = {
                something: "here",
                value: 1234
            };
            var options = SplunkLogger.prototype._initializeRequestOptions(optionsOriginal);
            assert.ok(options);
            assert.ok(Object.keys(options).length, 5);
            assert.strictEqual(options.json, false);
            assert.strictEqual(options.strictSSL, false);
            assert.strictEqual(options.something, optionsOriginal.something);
            assert.strictEqual(options.value, optionsOriginal.value);
            assert.ok(options.headers);
            assert.strictEqual(Object.keys(options.headers).length, 0);
        });
        it("should get defaults with non-default values", function() {
            var optionsOriginal = {
                strictSSL: true,
                headers: {
                    Authorization: "nothing"
                },
                dummy: "value"
            };

            var options = SplunkLogger.prototype._initializeRequestOptions(optionsOriginal);
            assert.ok(options);
            assert.ok(Object.keys(options).length, 4);
            assert.strictEqual(options.json, false);
            assert.strictEqual(options.strictSSL, true);
            assert.strictEqual(options.dummy, "value");
            assert.ok(options.headers);
            assert.strictEqual(Object.keys(options.headers).length, 1);
            assert.strictEqual(options.headers["Authorization"], "nothing");
        });
    });
    describe("_validateMessage", function() {
        it("should error with no args", function() {
            try {
                SplunkLogger.prototype._validateMessage();
                assert.ok(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Message argument is required.");
            }
        });
        it("should leave string intact", function() {
            var beforeMessage = "something";
            var afterMessage = SplunkLogger.prototype._validateMessage(beforeMessage);
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
        it("should succeed with default context, specifying a string message", function() {
            var context = {
                message: "some data"
            };

            var initialized = SplunkLogger.prototype._initializeContext(context);
            var data = initialized.message;

            assert.ok(initialized);
            assert.ok(data);
            assert.strictEqual(data, context.message);
        });
    });
    describe("constructor + _initializeConfig", function() {
        it("token in constructor, then init with empty config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var expected = {
                token: config.token,
                name: "splunk-javascript-logging/0.11.1",
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

            Logger._initializeConfig({});
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
        });
        it("token in constructor, then init with full config", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };

            var expected = {
                token: config.token,
                name: "splunk-javascript-logging/0.11.1",
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

            expected.token = "a-different-token";
            Logger.config = Logger._initializeConfig(expected);
            assert.strictEqual(Logger.config.token, expected.token);
            assert.strictEqual(Logger.config.name, expected.name);
            assert.strictEqual(Logger.config.host, expected.host);
            assert.strictEqual(Logger.config.path, expected.path);
            assert.strictEqual(Logger.config.protocol, expected.protocol);
            assert.strictEqual(Logger.config.level, expected.level);
            assert.strictEqual(Logger.config.port, expected.port);
        });
    });
});
