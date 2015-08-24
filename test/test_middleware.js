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

            logger.send(config, data, function(err, resp, body) {
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

            logger.send(config, data, function(err, resp, body) {
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

            logger.send(config, data, function(err, resp, body) {
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

            logger.send(config, data, function(err, resp, body) {
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

            function middleware(data, next) {
                middlewareCount++;
                assert.strictEqual(data, "something");
                next(null, data);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);

            logger._sendEvents = function(config, data, next) {
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

            logger.send(config, initialData, function(err, resp, body) {
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

            function middleware(data, callback) {
                middlewareCount++;
                assert.strictEqual(data, "somet??hing");
                data = encodeURIComponent("somet??hing");
                callback(null, data);
            }

            function middleware2(data, callback) {
                middlewareCount++;
                assert.strictEqual(data, "somet%3F%3Fhing");
                callback(null, data);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);

            logger._sendEvents = function(config, data, next) {
                assert.strictEqual(data, "somet%3F%3Fhing");
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

            logger.send(config, initialData, function(err, resp, body) {
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

            function middleware(data, next) {
                middlewareCount++;
                assert.strictEqual(data, "somet??hing");
                data = encodeURIComponent("somet??hing");
                next(null, data);
            }

            function middleware2(data, next) {
                middlewareCount++;
                assert.strictEqual(data, "somet%3F%3Fhing");
                data = decodeURIComponent(data) + " changed";
                assert.strictEqual(data, "somet??hing changed");
                next(null, data);
            }

            function middleware3(data, next) {
                middlewareCount++;
                assert.strictEqual(data, "somet??hing changed");
                next(null, data);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(config, data, next) {
                assert.strictEqual(data, "somet??hing changed");
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

            logger.send(config, initialData, function(err, resp, body) {
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

            function middleware(data, next) {
                middlewareCount++;
                assert.strictEqual(data, initialData);

                assert.strictEqual(data.property, initialData.property);
                assert.strictEqual(data.nested.object, initialData.nested.object);
                assert.strictEqual(data.number, initialData.number);
                assert.strictEqual(data.bool, initialData.bool);

                data.property = "new";
                data.bool = true;
                next(null, data);
            }

            function middleware2(data, next) {
                middlewareCount++;
                
                assert.strictEqual(data.property, "new");
                assert.strictEqual(data.nested.object, initialData.nested.object);
                assert.strictEqual(data.number, initialData.number);
                assert.strictEqual(data.bool, true);

                data.number = 789;
                next(null, data);
            }

            function middleware3(data, next) {
                middlewareCount++;
                
                assert.strictEqual(data.property, "new");
                assert.strictEqual(data.nested.object, initialData.nested.object);
                assert.strictEqual(data.number, 789);
                assert.strictEqual(data.bool, true);

                next(null, data);
            }

            var logger = new SplunkLogger(config);
            logger.use(middleware);
            logger.use(middleware2);
            logger.use(middleware3);

            logger._sendEvents = function(config, data, next) {
                assert.strictEqual(data.property, "new");
                assert.strictEqual(data.nested.object, initialData.nested.object);
                assert.strictEqual(data.number, 789);
                assert.strictEqual(data.bool, true);

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

            logger.send(config, initialData, function(err, resp, body) {
                assert.ok(!err);
                assert.strictEqual(resp.body, body);
                assert.strictEqual(body.code, successBody.code);
                assert.strictEqual(body.text, successBody.text);
                assert.strictEqual(middlewareCount, 3);
                done();
            });
        });
    });
});