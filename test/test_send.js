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
var request = require("request");

var TOKEN;

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

describe("SplunkLogger _makeBody", function() {
    describe("Setup Splunk on localhost:8089 HEC", function() {
        it("should be enabled", function(done) {
            request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http/http/enable?output_mode=json", {strictSSL: false}, function(err) {
                assert.ok(!err);
                done();
            });
        });
        it("should create a token in test/config.json", function(done) {
            request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http?output_mode=json", {strictSSL: false, body: "name=splunk_logging" + Date.now()}, function(err, resp, body) {
                assert.ok(!err);
                var tokenStart = body.indexOf("\"token\":\"");
                var tokenEnd = tokenStart + 36; // 36 = guid length
                var token = body.substring(tokenStart + 9, tokenEnd + 9); // 9 = prefix length of \"token\":\"
                assert.strictEqual(token.length, 36);
                TOKEN = token;
                done();
            });
        });
        it("should have the env variable set", function() {
            assert.ok(TOKEN);
            assert.strictEqual(TOKEN.length, 36);
        });
    });

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
    describe("normal", function () {
        it("should error with bad token", function(done) {
            var config = {
                token: "token-goes-here"
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, invalidTokenBody.text);
                assert.strictEqual(body.code, invalidTokenBody.code);
                done();
            });
        });
        it("should send without callback", function(done) {
            var config = {
                token: TOKEN
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                message: data
            };

            assert.strictEqual(logger.serializedContextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.send(context);
            setTimeout(function() {
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 500);
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: TOKEN
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, using custom time", function(done) {
            var config = {
                token: TOKEN
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        // TODO: test unsuccessfully sending to another index with specific index token settings
        it("should succeed with valid token, sending to a different index", function(done) {
            var config = {
                token: TOKEN
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing source", function(done) {
            var config = {
                token: TOKEN
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing sourcetype", function(done) {
            var config = {
                token: TOKEN
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token, changing host", function(done) {
            var config = {
                token: TOKEN
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
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed with valid token", function(done) {
            var config = {
                token: TOKEN
            };

            var logger = new SplunkLogger(config);

            var data = "something";

            var context = {
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should succeed without token passed through context", function(done) {
            var config = {
                token: TOKEN
            };
            var logger = new SplunkLogger(config);

            assert.strictEqual(logger.config.token, TOKEN);

            var data = "something";

            var context = {
                config: {},
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should fail on wrong protocol (assumes HTTP is invalid)", function(done) {
            var config = {
                token: TOKEN,
                protocol: "http"
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
                token: TOKEN,
                url: "https://something-so-invalid-that-it-should-never-exist.xyz:12345/junk"
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
                assert.strictEqual(err.message.indexOf("getaddrinfo ENOTFOUND"), 0);
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
                assert.strictEqual(err.message.indexOf("getaddrinfo ENOTFOUND"), 0);
                assert.strictEqual(err.code, "ENOTFOUND");
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should succeed with valid token, using non-default url", function(done) {
            var config = {
                token: TOKEN,
                url: "https://localhost:8088/services/collector/event/1.0"
            };

            var logger = new SplunkLogger(config);

            var data = "something";
            var context = {
                message: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                done();
            });
        });
        it("should error with valid token, using strict SSL", function(done) {
            var config = {
                token: TOKEN
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
                // err.code is only defined on modern modern Node.js versions
                if (err.code) {
                    assert.strictEqual(err.code, "SELF_SIGNED_CERT_IN_CHAIN");
                }
                assert.ok(!resp);
                assert.ok(!body);
                done();
            });
        });
        it("should send 2 events with valid token, w/o callbacks", function(done) {
            var config = {
                token: TOKEN
            };

            var logger = new SplunkLogger(config);

            var data = "batched event";
            var context = {
                message: data
            };
            
            var sent = 0;

            // Wrap sendevents to ensure it gets called
            var sendEvents = logger._sendEvents;
            logger._sendEvents = function(queue, cb) {
                sent++;
                sendEvents(queue, cb);
            };

            logger.send(context);
            var context2 = {
                message: "second batched event"
            };
            logger.send(context2);

            setTimeout(function() {
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                assert.strictEqual(sent, 2);
                done();
            }, 1000);
        });
    });
    describe("default batching settings", function () {
        it("should get no data response when flushing empty batch with valid token", function(done) {
            var config = {
                token: TOKEN
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

            assert.strictEqual(logger.serializedContextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.ok(run);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, noDataBody.text);
                assert.strictEqual(body.code, noDataBody.code);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            });
        });
        it("should be noop when flushing empty batch, without callback, with valid token", function(done) {
            var config = {
                token: TOKEN
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
            assert.strictEqual(logger.serializedContextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
            logger.flush();
            assert.strictEqual(logger.serializedContextQueue.length, 0);
            assert.strictEqual(logger.eventsBatchSize, 0);
        });
        it("should flush a batch of 1 event with valid token", function(done) {
            var config = {
                token: TOKEN,
                maxBatchCount: 0 // Use manual batching
            };

            var logger = new SplunkLogger(config);

            var data = this.test.fullTitle();
            var context = {
                message: data
            };
        
            logger.send(context);

            assert.strictEqual(logger.serializedContextQueue.length, 1);
            assert.ok(logger.eventsBatchSize > 50);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            });
        });
        it("should flush a batch of 2 events with valid token", function(done) {
            var config = {
                token: TOKEN,
                maxBatchCount: 0
            };

            var logger = new SplunkLogger(config);

            var data = this.test.fullTitle();
            var context = {
                message: data
            };

            logger.send(context);
            logger.send(context);

            assert.strictEqual(logger.serializedContextQueue.length, 2);
            assert.ok(logger.eventsBatchSize > 100);
            logger.flush(function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, JSON.stringify(body));
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            });
        });
    });
    describe("using retry", function() {
        it("should retry exactly 0 times (send once only)", function(done) {
            var config = {
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                    var body = JSON.stringify(invalidTokenBody);
                    callback(new Error(), {body: body}, body);
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
                token: TOKEN,
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
                token: TOKEN,
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
                token: TOKEN,
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
                token: TOKEN,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
                    callback(err, resp, body);
                });
            };

            setTimeout(function() {
                assert.strictEqual(logger._timerDuration, 100);
                assert.strictEqual(posts, 0);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 1 event", function(done) {
            var config = {
                token: TOKEN,
                batchInterval: 100,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
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
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 2 events", function(done) {
            var config = {
                token: TOKEN,
                batchInterval: 100,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
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
                assert.strictEqual(logger.serializedContextQueue.length, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should only make 1 POST request for 5 events", function(done) {
            var config = {
                token: TOKEN,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
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
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should error when trying to set batchInterval to a negative value after logger creation", function() {
            var config = {
                token: TOKEN
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
        it("should flush a stale event after enabling batching and batchInterval", function(done) {
            var config = {
                token: TOKEN,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
                    callback(err, resp, body);
                });
            };
            
            var payload = {
                message: "something"
            };
            logger.send(payload);
            assert.strictEqual(logger._timerDuration, 0);
            
            logger.config.batchInterval = 100;
            logger._initializeConfig(logger.config);

            var payload2 = {
                message: "something else"
            };
            logger.send(payload2);

            setTimeout(function() {
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should flush an event with batchInterval, then set batchInterval=0 and maxBatchCount=3 for manual batching", function(done) {
            var config = {
                token: TOKEN,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
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

                assert.strictEqual(logger.serializedContextQueue.length, 2);
                assert.ok(logger.eventsBatchSize > 150);
                logger.send(payload2); // This should trigger a flush
                run = true;
            }, 150);

            setTimeout(function() {
                assert.ok(run);
                assert.strictEqual(posts, 2);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);

                // Clean up the timer
                logger._disableTimer();
                done();
            }, 500);
        });
        it("should flush an event with batchInterval=100", function(done) {
            var config = {
                token: TOKEN,
                batchInterval: 100,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
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

                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
                run = true;
            }, 150);


            setTimeout(function() {
                assert.ok(run);
                assert.strictEqual(posts, 2);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
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
                token: TOKEN
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
                    assert.strictEqual(logger.serializedContextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);

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
                token: TOKEN,
                maxBatchCount: 10,
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
                    assert.strictEqual(logger.serializedContextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);

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
                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                logger.send(payload);
            }, 300);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
            }, 400);
        });
        it("should flush first event after 200ms, with maxBatchSize=200", function(done) {
            var config = {
                token: TOKEN,
                maxBatchSize: 200,
                batchInterval: 200,
                maxBatchCount: 10
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);

            // Make sure the event wasn't flushed yet
            setTimeout(function() {
                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 250);
        });
        it("should flush first event before 200ms, with maxBatchSize=1", function(done) {
            var config = {
                token: TOKEN,
                maxBatchSize: 1,
                batchInterval: 200,
                maxBatchCount: 10
            };
            var logger = new SplunkLogger(config);

            var posts = 0;

            // Wrap _post so we can verify how many times we called it
            var _post = logger._post;
            logger._post = function(context) {
                _post(context, function(err, resp, body) {
                    posts++;

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
                });
            };

            var payload = {
                message: "more than 1 byte"
            };
            logger.send(payload);

            // Event should be sent before the interval timer runs the first time
            setTimeout(function() {
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(posts, 1);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                done();
            }, 250);
        });
    });
    describe("using max batch count", function() {
        it("should flush first event immediately with maxBatchCount=1 with large maxBatchSize", function(done) {
            var config = {
                token: TOKEN,
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
                    assert.strictEqual(logger.serializedContextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);

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
                token: TOKEN,
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
                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                done();
            }, 1000);
        });
        it("should flush first 2 events after maxBatchCount=2, ignoring large maxBatchSize", function(done) {
            var config = {
                token: TOKEN,
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
                    assert.strictEqual(logger.serializedContextQueue.length, 0);
                    assert.strictEqual(logger.eventsBatchSize, 0);

                    assert.ok(!err);
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);

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
                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);

                logger.send(payload);
            }, 300);

            setTimeout(function() {
                assert.ok(!logger._timerID);
                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
            }, 400);
        });
        it("should flush first event after 200ms, with maxBatchCount=10", function(done) {
            var config = {
                token: TOKEN,
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
                    var b = JSON.parse(body);
                    assert.strictEqual(b.code, successBody.code);
                    assert.strictEqual(b.text, successBody.text);
                });
            };

            var payload = {
                message: "one event"
            };
            logger.send(payload);

            // Make sure the event wasn't flushed yet
            setTimeout(function() {
                assert.strictEqual(logger.serializedContextQueue.length, 1);
                assert.ok(logger.eventsBatchSize > 50);
            }, 150);

            setTimeout(function() {
                assert.ok(logger._timerID);
                assert.strictEqual(logger._timerDuration, 200);
                logger._disableTimer();

                assert.strictEqual(posts, 1);
                assert.strictEqual(logger.serializedContextQueue.length, 0);
                assert.strictEqual(logger.eventsBatchSize, 0);
                done();
            }, 300);
        });
    });
    describe("using custom eventFormatter", function() {
        it("should use custom event formatter, instead of the default", function(done) {
            var config = {
                token: TOKEN,
                maxBatchCount: 1
            };
            var logger = new SplunkLogger(config);

            logger.eventFormatter = function(message, severity) {
                var ret = "[" + severity + "]";
                for (var key in message) {
                    if (message.hasOwnProperty(key)) {
                        ret += key + "=" + message[key] + ", ";
                    }
                }
                return ret;
            };

            var post = logger._post;
            logger._post = function(opts, callback) {
                var expected = "[info]some=data, asObject=true, num=123, ";

                assert.ok(opts);
                assert.ok(opts.hasOwnProperty("body"));
                var body = JSON.parse(opts.body);
                assert.ok(body.hasOwnProperty("event"));
                assert.ok(body.hasOwnProperty("time"));

                assert.strictEqual(body.event, expected);

                post(opts, callback);
            };

            logger.send({message: {some: "data", asObject: true, num: 123}}, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                done();
            });
        });
    });
    describe("receiving HTML response", function() {
        it("should handle JSON parsing exception without crashing", function(done) {
            var config = {
                token: TOKEN
            };
            var logger = new SplunkLogger(config);
            logger.requestOptions.fail = "yes";

            logger.error = function() {
                return;
            };

            var post = logger._post;
            logger._post = function(opts, callback) {
                if (opts.fail === "yes") {
                    var resp = {
                        body: "<!doctype>\n<html>\n</html>"
                    };
                    callback(null, resp, resp.body);
                }
                else {
                    post(opts, callback);
                }
            };

            logger.send({message:"foo"}, function(err, resp, body) {
                assert.ok(!err);
                assert.ok(resp);
                assert.ok(body);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body, "<!doctype>\n<html>\n</html>");
                done();
            });
        });
    });
});
