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

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

var successBody = {
    text: "Success",
    code: 0
};

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

var noDataBody = {
    text: "No data",
    code: 5
};

// TODO: add a test that gets this response
// var incorrectIndexBody = {
//     text: "Incorrect index",
//     code: 7,
//     "invalid-event-number": 1
// };

// Backup console.log so we can restore it later
var ___log = console.log;
/**
 * Silences console.log
 * Undo this effect by calling unmute().
 */
function mute() {
    console.log = function(){};
}

/**
 * Un-silences console.log
 */
function unmute() {
    console.log = ___log;
}

describe("SplunkLogger _makedata", function() {
    it("should error with no args", function() {
        try {
            SplunkLogger.prototype._makeBody();
            assert.ok(false, "Expected an error.");
        }
        catch(err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Context parameter is required.");
        }
    });
    it("should objectify data as string, with default severity", function() {
        var context = {
            message: "something"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as array, without severity param", function() {
        var context = {
            message: ["something"]
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as object, without severity param", function() {
        var context = {
            message: {
                prop: "something"
            }
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.message.prop, "something");
        assert.strictEqual(body.event.severity, "info");
    });
    it("should objectify data as string, with severity param", function() {
        var context = {
            message: "something",
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.severity, "urgent");
    });
    it("should objectify data as array, with severity param", function() {
        var context = {
            message: ["something"],
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.severity, "urgent");
    });
    it("should objectify data as object, with severity param", function() {
        var context = {
            message: {
                prop: "something"
            },
            severity: "urgent"
        };
        var body = SplunkLogger.prototype._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        assert.ok(body.event.hasOwnProperty("message"));
        assert.strictEqual(body.event.message, context.message);
        assert.strictEqual(body.event.message.prop, "something");
        assert.strictEqual(body.event.severity, "urgent");
    });
});
describe("SplunkLogger send", function() {
    describe("using default middleware (integration tests)", function () {
        it("should error with bad token", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, invalidTokenBody.text);
                assert.strictEqual(err.code, invalidTokenBody.code);
                assert.ok(errContext);
                assert.strictEqual(errContext, context);
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(run);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, invalidTokenBody.text);
                assert.strictEqual(body.code, invalidTokenBody.code);
                done();
            });
        });
        it("should send without callback", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                message: data
            };

            assert.strictEqual(logger.contextQueue.length, 0);
            logger.send(context);
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            }, 500);
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, using custom time", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                message: data,
                metadata: {
                    time: new Date("January 1, 2015")
                }
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        // TODO: test unsuccessfully sending to another index with specific index token settings
        it("should succeed with valid token, sending to a different index", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                message: data,
                metadata: {
                    index: "default"
                }
            };

            logger.error = function() {
                assert.ok(false);
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing source", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                message: data,
                metadata: {
                    source: "_____new____source"
                }
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing sourcetype", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: config,
                message: data,
                metadata: {
                    sourcetype: "_____new____sourcetype"
                }
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing host", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
                config: logger.config,
                message: data,
                metadata: {
                    host: "some.other.host"
                }
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with different valid token passed through context", function(done) {
            var config = {
                token: "invalid-token"
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            config.token = configurationFile.token;
            var context = {
                config: config,
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                config: config,
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed without token passed through context", function(done) {
            var config = {
                token: configurationFile.token
            };
            var logger = new SplunkLogger(config);

            assert.strictEqual(logger.config.token, config.token);

            var data = "something";

            var context = {
                config: {},
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should fail on wrong protocol (assumes HTTP is invalid)", function(done) {
            var config = {
                token: configurationFile.token,
                protocol: "http"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "socket hang up");
                assert.strictEqual(err.code, "ECONNRESET");
                assert.ok(errContext);
                assert.strictEqual(errContext, context);
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.ok(run);
                assert.strictEqual(err.message, "socket hang up");
                assert.strictEqual(err.code, "ECONNRESET");
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should fail on wrong Splunk server", function(done) {
            var config = {
                token: configurationFile.token,
                url: "https://something-so-invalid-that-it-should-never-exist.xyz:12345/junk"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                // TODO: the resp.statusCode is what we want, but can't access here!
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "getaddrinfo ENOTFOUND");
                assert.strictEqual(err.code, "ENOTFOUND");
                assert.ok(errContext);
                assert.strictEqual(errContext, context);
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.ok(run);
                assert.strictEqual(err.message, "getaddrinfo ENOTFOUND");
                assert.strictEqual(err.code, "ENOTFOUND");
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should succeed with valid token, using non-default url", function(done) {
            var config = {
                token: configurationFile.token,
                url: "https://localhost:8088/services/collector/event/1.0"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should error with valid token, using strict SSL", function(done) {
            var config = {
                token: configurationFile.token,
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                config: config,
                message: data,
                requestOptions: {
                    strictSSL: true
                }
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "SELF_SIGNED_CERT_IN_CHAIN");
                assert.ok(errContext);
                assert.strictEqual(errContext, context);
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.ok(run);
                assert.strictEqual(err.message, "SELF_SIGNED_CERT_IN_CHAIN");
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should send 2 events with valid token, w/o callbacks", function(done) {
            var config = {
                token: configurationFile.token
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                config: config,
                message: data
            };
            
            var sent = 0;

            // Wrap sendevents to ensure it gets called
            logger._sendEvents = function(cont, cb) {
                sent++;
                SplunkLogger.prototype._sendEvents(cont, cb);
            };

            logger.send(context);
            logger.send(context);

            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(sent, 2);
                done();
            }, 1000);
        });
    });
    describe("without autoFlush (integration tests)", function () {
        it("should get no data response when flushing empty batch with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, noDataBody.text);
                assert.strictEqual(err.code, noDataBody.code);
                assert.ok(errContext);
            };

            assert.strictEqual(logger.contextQueue.length, 0);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.ok(run);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, noDataBody.text);
                assert.strictEqual(body.code, noDataBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
        it("should be noop when flushing empty batch, without callback, with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            logger.error = function(err, errContext) {
                assert.ok(err);
                assert.strictEqual(err.message, noDataBody.text);
                assert.strictEqual(err.code, noDataBody.code);
                assert.ok(errContext);
                done();
            };

            // Nothing should be sent if queue is empty
            assert.strictEqual(logger.contextQueue.length, 0);
            logger.flush();
            assert.strictEqual(logger.contextQueue.length, 0);
        });
        it("should flush a batch of 1 event with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            var data = "batched event 1";
            var context = {
                config: config,
                message: data
            };
        
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 1);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
        it("should flush a batch of 2 events with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                config: config,
                message: data
            };

            logger.send(context);
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 2);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            });
        });
    });
    describe("using custom middleware", function() {
        it("should error with non-function middleware", function() {
            var config = {
                token: "a-token-goes-here-usually"
            };
            try {
                var logger = new SplunkLogger(config);
                logger.use("not a function");
                assert.fail(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Middleware must be a function.");
            }
        });
        it("should succeed using non-default middleware", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "something");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(context, next) {
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "something";
            var context = {
                config: config,
                message: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 1);
                done();
            });
        });
        it("should succeed using non-default middleware, without passing the context through", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "something");
                next(null);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context, initialContext);
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "something";
            var initialContext = {
                config: config,
                message: initialData
            };

            logger.send(initialContext, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 1);
                done();
            });
        });
        it("should succeed using 2 middlewares", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.message, "somet??hing");
                context.message = encodeURIComponent(context.message);
                callback(null, context);
            }

            function middleware2(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.message, "somet%3F%3Fhing");
                callback(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.message, "somet%3F%3Fhing");
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "somet??hing";
            var context = {
                config: config,
                message: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 2);
                done();
            });
        });
        it("should succeed using 3 middlewares", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "somet??hing");
                context.message = encodeURIComponent(context.message);
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "somet%3F%3Fhing");
                context.message = decodeURIComponent(context.message) + " changed";
                assert.strictEqual(context.message, "somet??hing changed");
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "somet??hing changed");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.message, "somet??hing changed");
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "somet??hing";
            var context = {
                config: config,
                message: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 3);
                done();
            });
        });
        it("should succeed using 3 middlewares with data object", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, initialData);

                assert.strictEqual(context.message.property, initialData.property);
                assert.strictEqual(context.message.nested.object, initialData.nested.object);
                assert.strictEqual(context.message.number, initialData.number);
                assert.strictEqual(context.message.bool, initialData.bool);

                context.message.property = "new";
                context.message.bool = true;
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.message.property, "new");
                assert.strictEqual(context.message.nested.object, initialData.nested.object);
                assert.strictEqual(context.message.number, initialData.number);
                assert.strictEqual(context.message.bool, true);

                context.message.number = 789;
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.message.property, "new");
                assert.strictEqual(context.message.nested.object, initialData.nested.object);
                assert.strictEqual(context.message.number, 789);
                assert.strictEqual(context.message.bool, true);

                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.message.property, "new");
                assert.strictEqual(context.message.nested.object, initialData.nested.object);
                assert.strictEqual(context.message.number, 789);
                assert.strictEqual(context.message.bool, true);

                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = {
                property: "one",
                nested: {
                    object: "value"
                },
                number: 1234,
                bool: false
            };
            var context = {
                config: config,
                message: initialData
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 3);
                done();
            });
        });
    });
    describe("error handlers", function() {
        it("should get error and context using default error handler, without passing context to next()", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "something");
                context.message = "something else";
                next(new Error("error!"));
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
                config: config,
                message: initialData
            };

            var run = false;

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                run = true;
                assert.ok(err);
                assert.ok(context);
                assert.strictEqual(err.message, "error!");
                initialContext.message = "something else";
                assert.strictEqual(context, initialContext);
                
                mute();
                errCallback(err, context);
                unmute();

                done();
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(initialContext);

            assert.ok(run);
            assert.strictEqual(middlewareCount, 1);
        });
        it("should get error and context using default error handler", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "something");
                context.message = "something else";
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
                config: config,
                message: initialData
            };

            var run = false;

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                run = true;
                assert.ok(err);
                assert.ok(context);
                assert.strictEqual(err.message, "error!");
                initialContext.message = "something else";
                assert.strictEqual(context, initialContext);

                mute();
                errCallback(err, context);
                unmute();

                done();
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(initialContext);

            assert.ok(run);
            assert.strictEqual(middlewareCount, 1);
        });
        it("should get error and context sending twice using default error handler", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.message, "something");
                context.message = "something else";
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var context1 = {
                config: config,
                message: initialData
            };

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.strictEqual(err.message, "error!");
                assert.ok(context);
                assert.strictEqual(context.message, "something else");

                var comparing = context1;
                if (middlewareCount === 2) {
                    comparing = context2;
                }
                assert.strictEqual(context.severity, comparing.severity);
                assert.strictEqual(context.config, comparing.config);
                assert.strictEqual(context.requestOptions, comparing.requestOptions);
                
                mute();
                errCallback(err, context);
                unmute();

                if (middlewareCount === 2) {
                    done();
                }
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(context1);
            // Reset the data, hopefully this doesn't explode
            var context2 = JSON.parse(JSON.stringify(context1));
            context2.message = "something";
            logger.send(context2);

            assert.strictEqual(middlewareCount, 2);
        });
    });
    describe("using retry", function() {
        it("should retry exactly 0 times (send once only)", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 0
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === config.maxRetries + 1) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, config.maxRetries + 1);
                done();
            });
        });
        it("should retry exactly once", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 1
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === config.maxRetries + 1) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, config.maxRetries + 1);
                done();
            });
        });
        it("should retry exactly twice", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 2
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === config.maxRetries + 1) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, config.maxRetries + 1);
                done();
            });
        });
        it("should retry exactly 5 times", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 5
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === config.maxRetries + 1) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, config.maxRetries + 1);
                done();
            });
        });
        it("should not retry on initial success when maxRetries=1", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 1
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === 1) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, 1);
                done();
            });
        });
        it("should retry once when maxRetries=10", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 10
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                if (retryCount === 2) {
                    post(requestOptions, callback);
                }
                else {
                    callback(new Error(), {body: invalidTokenBody}, invalidTokenBody);
                }
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(retryCount, 2);
                done();
            });
        });
        it("should retry on request error when maxRetries=0", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 0,
                host: "bad-hostname.invalid"
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(err);
                assert.ok(!resp);
                assert.ok(!body);
                
                assert.strictEqual(config.maxRetries + 1, retryCount);
                assert.ok(run);
                done();
            });
        });
        it("should retry on request error when maxRetries=1", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 1,
                host: "bad-hostname.invalid"
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(err);
                assert.ok(!resp);
                assert.ok(!body);
                
                assert.strictEqual(config.maxRetries + 1, retryCount);
                assert.ok(run);
                done();
            });
        });
        it("should retry on request error when maxRetries=5", function(done) {
            var config = {
                token: configurationFile.token,
                maxRetries: 5,
                host: "bad-hostname.invalid"
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(err);
                assert.ok(!resp);
                assert.ok(!body);
                
                assert.strictEqual(config.maxRetries + 1, retryCount);
                assert.ok(run);
                done();
            });
        });
        it("should not retry on Splunk error when maxRetries=0", function(done) {
            var config = {
                token: "invalid-token",
                maxRetries: 0
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(invalidTokenBody.code, body.code);
                assert.strictEqual(invalidTokenBody.text, body.text);
                
                assert.strictEqual(1, retryCount);
                assert.ok(run);
                done();
            });
        });
        it("should not retry on Splunk error when maxRetries=1", function(done) {
            var config = {
                token: "invalid-token",
                maxRetries: 1
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(invalidTokenBody.code, body.code);
                assert.strictEqual(invalidTokenBody.text, body.text);
                
                assert.strictEqual(1, retryCount);
                assert.ok(run);
                done();
            });
        });
        it("should not retry on Splunk error when maxRetries=5", function(done) {
            var config = {
                token: "invalid-token",
                maxRetries: 5
            };
            var logger = new SplunkLogger(config);

            var retryCount = 0;

            // Wrap the _post so we can verify retries
            var post = logger._post;
            logger._post = function(requestOptions, callback) {
                retryCount++;
                post(requestOptions, callback);
            };

            var run = false;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.ok(context);
                run = true;
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(invalidTokenBody.code, body.code);
                assert.strictEqual(invalidTokenBody.text, body.text);
                
                assert.strictEqual(1, retryCount);
                assert.ok(run);
                done();
            });
        });
    });
});
