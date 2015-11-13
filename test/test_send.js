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

describe("SplunkLogger _makeBody", function() {
    it("should error with no args", function() {
        try {
            var logger = new SplunkLogger({token: "token-goes-here"});
            logger._makeBody();
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
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(event.message, context.message);
        assert.strictEqual(event.severity, "info");
    });
    it("should objectify data as array, without severity param", function() {
        var context = {
            message: ["something"]
        };
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(event.message.length, context.message.length);
        assert.strictEqual(event.message[0], context.message[0]);
        assert.strictEqual(event.severity, "info");
    });
    it("should objectify data as object, without severity param", function() {
        var context = {
            message: {
                prop: "something"
            }
        };
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(Object.keys(event.message).length, Object.keys(context.message).length);
        assert.strictEqual(event.message.prop, "something");
        assert.strictEqual(event.severity, "info");
    });
    it("should objectify data as string, with severity param", function() {
        var context = {
            message: "something",
            severity: "urgent"
        };
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(event.message, context.message);
        assert.strictEqual(event.severity, "urgent");
    });
    it("should objectify data as array, with severity param", function() {
        var context = {
            message: ["something"],
            severity: "urgent"
        };
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(event.message.length, context.message.length);
        assert.strictEqual(event.message[0], context.message[0]);
        assert.strictEqual(event.severity, "urgent");
    });
    it("should objectify data as object, with severity param", function() {
        var context = {
            message: {
                prop: "something"
            },
            severity: "urgent"
        };
        var logger = new SplunkLogger({token: "token-goes-here"});
        var body = logger._makeBody(context);
        
        assert.ok(body);
        assert.ok(body.hasOwnProperty("event"));
        assert.strictEqual(Object.keys(body).length, 2);
        var event = body.event;
        assert.ok(event.hasOwnProperty("message"));
        assert.strictEqual(Object.keys(event.message).length, Object.keys(context.message).length);
        assert.strictEqual(event.message.prop, "something");
        assert.strictEqual(event.severity, "urgent");
    });
});
describe("SplunkLogger send (integration tests)", function() {
    describe("using no middleware", function () {
        it("should error with bad token", function(done) {
            var config = {
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, invalidTokenBody.text);
                assert.strictEqual(err.code, invalidTokenBody.code);

                assert.ok(errContext);
                var body = JSON.parse(errContext.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, context.message);
                assert.strictEqual(event.severity, "info");
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                message: data
            };

            assert.strictEqual(logger.contextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.send(context);
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 500);
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something else";

            var context = {
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
        it("should succeed with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
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
                protocol: "http",
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "socket hang up");
                assert.strictEqual(err.code, "ECONNRESET");
                
                assert.ok(errContext);
                var body = JSON.parse(errContext.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, context.message);
                assert.strictEqual(event.severity, "info");
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
                url: "https://something-so-invalid-that-it-should-never-exist.xyz:12345/junk",
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "getaddrinfo ENOTFOUND");
                assert.strictEqual(err.code, "ENOTFOUND");

                assert.ok(errContext);
                var body = JSON.parse(errContext.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, context.message);
                assert.strictEqual(event.severity, "info");
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
                url: "https://localhost:8088/services/collector/event/1.0",
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
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
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            logger.requestOptions.strictSSL = true;

            var data = "something";
            var context = {
                message: data
            };

            var run = false;

            logger.error = function(err, errContext) {
                run = true;
                assert.ok(err);
                assert.strictEqual(err.message, "SELF_SIGNED_CERT_IN_CHAIN");
                assert.ok(errContext);

                var body = JSON.parse(errContext.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message, context.message);
                assert.strictEqual(event.severity, "info");
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                message: data
            };
            
            var sent = 0;

            // Wrap sendevents to ensure it gets called
            var sendEvents = logger._sendEvents;
            logger._sendEvents = function(cont, cb) {
                sent++;
                sendEvents(cont, cb);
            };

            logger.send(context);
            var context2 = {
                message: "second batched event"
            };
            logger.send(context2);

            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                assert.strictEqual(sent, 2);
                done();
            }, 1000);
        });
    });
    describe("without autoFlush", function () {
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
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.ok(run);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, noDataBody.text);
                assert.strictEqual(body.code, noDataBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
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
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.flush();
            assert.strictEqual(logger.contextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
        });
        it("should flush a batch of 1 event with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            var data = this.test.fullTitle();
            var context = {
                message: data
            };
        
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 1);
            assert.ok(logger.eventsBatchSize > 50);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            });
        });
        it("should flush a batch of 2 events with valid token", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };

            var logger = new SplunkLogger(config);

            var data = this.test.fullTitle();
            var context = {
                message: data
            };

            logger.send(context);
            logger.send(context);

            assert.strictEqual(logger.contextQueue.length, 2);
            assert.ok(logger.eventsBatchSize > 100);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, "something");
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
        it("should succeed using non-default middleware with manual batching", function(done) {
            var config = {
                token: "token-goes-here",
                autoFlush: false
            };

            var initialData = "something";
            var sentContext = {
                message: initialData
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var expectedString = JSON.stringify(logger._makeBody(sentContext));

                assert.strictEqual(expectedString.length * 3, context.message.length);
                
                // Search the payload, we should have 3 identical events
                for (var i = 1; i <= 3; i++) {
                    var start = (i - 1) * expectedString.length;
                    var end = start + expectedString.length;

                    // Don't compare timestamps
                    var expected = JSON.parse(expectedString);
                    var actual = JSON.parse(context.message.substring(start, end));
                    assert.ok(expected.hasOwnProperty("event"));
                    assert.ok(expected.hasOwnProperty("time"));
                    assert.ok(actual.hasOwnProperty("event"));
                    assert.ok(actual.hasOwnProperty("time"));
                    assert.strictEqual(JSON.stringify(expected.event), JSON.stringify(actual.event));
                }
                
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

            logger.send(sentContext);
            logger.send(sentContext);
            logger.send(sentContext);

            logger.flush(function(err, resp, body) {
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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, "something");
                next(null);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(context, next) {
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, initialContext.message);
                assert.strictEqual(event.severity, "info");

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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, callback) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, "some??thing");

                body.event.message = encodeURIComponent(event.message);
                context.message = JSON.stringify(body);
                callback(null, context);
            }

            function middleware2(context, callback) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.strictEqual(event.message, "some%3F%3Fthing");
                assert.strictEqual(event.severity, "info");

                callback(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);

            logger._sendEvents = function(context, next) {
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                assert.strictEqual(Object.keys(body).length, 2);
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "some%3F%3Fthing");
                
                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    },
                    body: successBody
                };
                next(null, response, successBody);
            };

            var initialData = "some??thing";
            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "some??thing");
                assert.strictEqual(event.severity, "info");

                body.event.message = encodeURIComponent(event.message);
                context.message = JSON.stringify(body);
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "some%3F%3Fthing");
                assert.strictEqual(event.severity, "info");

                body.event.message = decodeURIComponent(event.message) + " changed";
                context.message = JSON.stringify(body);
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "some??thing changed");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            var _sendEvents = logger._sendEvents;
            logger._sendEvents = function(context, next) {
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "some??thing changed");

                _sendEvents(context, next);
            };

            var initialData = "some??thing";
            var context = {
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
                token: configurationFile.token,
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(Object.keys(event.message).length, Object.keys(initialData).length);
                assert.strictEqual(event.message.property, initialData.property);
                assert.strictEqual(event.message.nested.object, initialData.nested.object);
                assert.strictEqual(event.message.number, initialData.number);
                assert.strictEqual(event.message.bool, initialData.bool);

                body.event.message.property = "new";
                body.event.message.bool = true;
                context.message = JSON.stringify(body);
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(Object.keys(event.message).length, Object.keys(initialData).length);
                assert.strictEqual(event.message.property, "new");
                assert.strictEqual(event.message.nested.object, initialData.nested.object);
                assert.strictEqual(event.message.number, initialData.number);
                assert.strictEqual(event.message.bool, true);

                body.event.message.number = 789;
                context.message = JSON.stringify(body);
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(Object.keys(event.message).length, Object.keys(initialData).length);
                assert.strictEqual(event.message.property, "new");
                assert.strictEqual(event.message.nested.object, initialData.nested.object);
                assert.strictEqual(event.message.number, 789);
                assert.strictEqual(event.message.bool, true);

                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            var _sendEvents = logger._sendEvents;
            logger._sendEvents = function(context, next) {
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message.property, "new");
                assert.strictEqual(event.message.nested.object, initialData.nested.object);
                assert.strictEqual(event.message.number, 789);
                assert.strictEqual(event.message.bool, true);

                _sendEvents(context, next);
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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));
                assert.strictEqual(event.message, "something");
                

                body.event.message = "something else";
                context.message = JSON.stringify(body);
                next(new Error("error!"));
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
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

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message, "something else");
                
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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message, "something");

                body.event.message = "something else";
                context.message = JSON.stringify(body);
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var initialContext = {
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

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                body.event.message = "something else";
                context.message = JSON.stringify(body);

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
                token: "token-goes-here",
                maxBatchCount: 1
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message, "something");
                assert.strictEqual(event.severity, "info");

                body.event.message = "something else";
                context.message = JSON.stringify(body);
                next(new Error("error!"), context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var context1 = {
                message: initialData
            };

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err, context) {
                assert.ok(err);
                assert.strictEqual(err.message, "error!");
                assert.ok(context);

                var body = JSON.parse(context.message);
                assert.ok(body.hasOwnProperty("time"));
                assert.ok(body.hasOwnProperty("event"));
                var event = body.event;
                assert.ok(event.hasOwnProperty("message"));
                assert.ok(event.hasOwnProperty("severity"));

                assert.strictEqual(event.message, "something else");

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
                maxRetries: 0,
                maxBatchCount: 1
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
                maxRetries: 1,
                maxBatchCount: 1
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
                maxRetries: 2,
                maxBatchCount: 1
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
                maxRetries: 5,
                maxBatchCount: 1
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
                maxRetries: 1,
                maxBatchCount: 1
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
                maxRetries: 10,
                maxBatchCount: 1
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
                host: "bad-hostname.invalid",
                maxBatchCount: 1
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
                host: "bad-hostname.invalid",
                maxBatchCount: 1
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
                host: "bad-hostname.invalid",
                maxBatchCount: 1
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
                maxRetries: 0,
                maxBatchCount: 1
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
                maxRetries: 1,
                maxBatchCount: 1
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
                maxRetries: 5,
                maxBatchCount: 1
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
                assert.strictEqual(body.code, invalidTokenBody.code);
                assert.strictEqual(body.text, invalidTokenBody.text);
                
                assert.strictEqual(1, retryCount);
                assert.ok(run);
                done();
            });
        });
    });
    describe("using batch interval", function() {
        it("should not make a POST request if contextQueue is always empty", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 100
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };

            setTimeout(function() {
                assert.strictEqual(logger._timerDuration, 100);
                assert.strictEqual(posts, 0);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 1 event", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 100
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);

            setTimeout(function() {
                assert.strictEqual(logger._timerDuration, 100);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 2 events", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 100
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            var payload2 = {
                message: "something 2"
            };
            logger.send(payload);
            logger.send(payload2);

            setTimeout(function() {
                assert.strictEqual(logger._timerDuration, 100);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 5 events", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 200,
                maxBatchSize: 5000,
                maxBatchCount: 10
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);
            logger.send(payload);
            logger.send(payload);
            logger.send(payload);
            logger.send(payload);

            setTimeout(function() {
                assert.strictEqual(logger._timerDuration, 200);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should error when trying to set batchInterval to a negative value after logger creation", function() {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };
            var logger = new SplunkLogger(config);

            try {
                logger._enableTimer(-1);
                assert.ok(false, "Expected an error.");
            }
            catch(err) {
                assert.ok(err);
                assert.strictEqual(err.message, "Batch interval must be a positive number, found: -1");
            }
        });
        it("should flush a stale event after enabling autoFlush and batchInterval", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: false
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);
            assert.strictEqual(logger._timerDuration, 0);
            
            logger.config.autoFlush = true;
            logger.config.batchInterval = 100;
            logger._initializeConfig(logger.config);

            var payload2 = {
                message: "something else"
            };
            logger.send(payload2);

            setTimeout(function() {
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should flush an event with batchInterval, then set batchInterval=0 and maxBatchCount=3 for manual batching", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 100,
                maxBatchSize: 100000,
                maxBatchCount: 3
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);

            var run = false;
            setTimeout(function() {
                logger.config.batchInterval = 0;

                var payload2 = {
                    message: "something else"
                };
                logger.send(payload2);
                logger.send(payload2);

                assert.strictEqual(logger.contextQueue.length, 2);
                assert.ok(logger.eventsBatchSize > 150);
                logger.send(payload2); // This should trigger a flush
                run = true;
            }, 150);

            setTimeout(function() {
                assert.ok(run);
                assert.strictEqual(posts, 2);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should flush an event with batchInterval=100", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                batchInterval: 100
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context, callback) {
                _post(context, function(err, resp, body) {
                    posts++;
                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);

            var run = false;
            setTimeout(function() {
                var payload2 = {
                    message: "something else"
                };
                logger.send(payload2);

                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
                run = true;
            }, 150);


            setTimeout(function() {
                assert.ok(run);
                assert.strictEqual(posts, 2);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 300);
        });
    });
    describe("using max batch size", function() {
        it("should flush first event immediately with maxBatchSize=1", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                maxBatchSize: 1
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!logger._timerID);
                    assert.strictEqual(posts, 1);
                    assert.strictEqual(logger.contextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);

                    done();
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);
        });
        it("should flush first 2 events after maxBatchSize>100", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                maxBatchSize: 100
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!logger._timerID);
                    assert.strictEqual(posts, 1);
                    assert.strictEqual(logger.contextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);

                    done();
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 0);
                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                logger.send(payload);
            }, 300);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
            }, 400);
        });
        it("should flush first event after 200ms, with maxBatchSize=200", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                maxBatchSize: 200,
                batchInterval: 200
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);

            // Make sure the event wasn't flushed yet
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 250);
        });
        it("should flush first event before 200ms, with maxBatchSize=1", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                maxBatchSize: 1,
                batchInterval: 200
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);

            // Event should be sent before the interval timer runs the first time
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(posts, 1);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                done();
            }, 250);
        });
    });
    describe("using max batch count", function() {
        it("should flush first event immediately with maxBatchCount=1 with large maxBatchSize", function(done) {
            var config = {
                token: configurationFile.token,
                maxBatchCount: 1,
                maxBatchSize: 123456
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!logger._timerID);
                    assert.strictEqual(posts, 1);
                    assert.strictEqual(logger.contextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);

                    done();
                });
            };

            var payload = {
                message: "one event"
            };
            logger.send(payload);
        });
        it("should not flush events with maxBatchCount=0 (meaning ignore) and large maxBatchSize", function(done) {
            var config = {
                token: configurationFile.token,
                maxBatchCount: 0,
                maxBatchSize: 123456
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                });
            };

            var payload = {
                message: "one event"
            };
            logger.send(payload);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 0);
                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                done();
            }, 1000);
        });
        it("should flush first 2 events after maxBatchCount=2, ignoring large maxBatchSize", function(done) {
            var config = {
                token: configurationFile.token,
                maxBatchCount: 2,
                maxBatchSize: 123456
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!logger._timerID);
                    assert.strictEqual(posts, 1);
                    assert.strictEqual(logger.contextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);

                    done();
                });
            };

            var payload = {
                message: "one event"
            };
            logger.send(payload);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 0);
                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                logger.send(payload);
            }, 300);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
            }, 400);
        });
        it("should flush first event after 200ms, with maxBatchCount=10", function(done) {
            var config = {
                token: configurationFile.token,
                autoFlush: true,
                maxBatchCount: 10,
                batchInterval: 200
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    assert.strictEqual(body.code, successBody.code);
                    assert.strictEqual(body.text, successBody.text);
                });
            };

            var payload = {
                message: "one event"
            };
            logger.send(payload);

            // Make sure the event wasn't flushed yet
            setTimeout(function() {
                assert.strictEqual(logger.contextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.contextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 300);
        });
    });
});
