var SplunkLogger = require("../index");
var assert = require("assert");

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

var invalidTokenBody = {
    text: "Invalid token",
    code: 4
};

var successBody = {
    text: "Success",
    code: 0
};

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
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.text, invalidTokenBody.text);
                assert.strictEqual(body.code, invalidTokenBody.code);
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
                data: data
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
                data: data
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
                data: data
            };

            logger.send(context, function(err, resp, body) {
                assert.ok(err);
                assert.strictEqual(err.message, "socket hang up");
                assert.strictEqual(err.code, "ECONNRESET");
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
                data: data
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
                assert.strictEqual(context.data, "something");
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
                data: initialData
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
        it("should succeed using 2 middlewares", function(done) {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet??hing");
                context.data = encodeURIComponent("somet??hing");
                callback(null, context);
            }

            function middleware2(context, callback) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet%3F%3Fhing");
                callback(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data, "somet%3F%3Fhing");
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
                data: initialData
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
                assert.strictEqual(context.data, "somet??hing");
                context.data = encodeURIComponent("somet??hing");
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet%3F%3Fhing");
                context.data = decodeURIComponent(context.data) + " changed";
                assert.strictEqual(context.data, "somet??hing changed");
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "somet??hing changed");
                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data, "somet??hing changed");
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
                data: initialData
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
                assert.strictEqual(context.data, initialData);

                assert.strictEqual(context.data.property, initialData.property);
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, initialData.number);
                assert.strictEqual(context.data.bool, initialData.bool);

                context.data.property = "new";
                context.data.bool = true;
                next(null, context);
            }

            function middleware2(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, initialData.number);
                assert.strictEqual(context.data.bool, true);

                context.data.number = 789;
                next(null, context);
            }

            function middleware3(context, next) {
                middlewareCount++;
                
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, 789);
                assert.strictEqual(context.data.bool, true);

                next(null, context);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(context, next) {
                assert.strictEqual(context.data.property, "new");
                assert.strictEqual(context.data.nested.object, initialData.nested.object);
                assert.strictEqual(context.data.number, 789);
                assert.strictEqual(context.data.bool, true);

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
                data: initialData
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
        it("default error handler", function() {
            var config = {
                token: "token-goes-here"
            };

            var middlewareCount = 0;

            function middleware(context, next) {
                middlewareCount++;
                assert.strictEqual(context.data, "something");
                next(new Error("error!"));
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            var initialData = "something";
            var context = {
                config: config,
                data: initialData
            };

            var run = false;

            // Wrap the default error callback for code coverage
            var errCallback = logger.error;
            logger.error = function(err) {
                run = true;
                assert.strictEqual(err.message, "error!");
                errCallback(err);
            };

            // Fire & forget, the callback won't be called anyways due to the error
            logger.send(context);

            assert.ok(run);
            assert.strictEqual(middlewareCount, 1);
        });
    });
});
