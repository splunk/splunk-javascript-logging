var splunklogging = require("../index");
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

describe("Test config file 'config.json'", function() {
    it("should at least have a token", function() {
        assert.ok(configurationFile);
        assert.ok(configurationFile.hasOwnProperty("token"));
        assert.ok(configurationFile.token.length > 0);
    });
});

describe("send", function () {
    it("should use default middleware, and error with bad token", function(done) {
        var config = {
            token: "token-goes-here"
        };

        var validatedConfig = splunklogging.validateConfig(config);

        var data = "something";

        splunklogging.send(config, data, function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(body.text, invalidTokenBody.text);
            assert.strictEqual(body.code, invalidTokenBody.code);
            done();
        });
    });
    it("should use default middleware with valid token", function(done) {
        var config = {
            token: configurationFile.token
        };

        var validatedConfig = splunklogging.validateConfig(config);

        var data = "something";

        splunklogging.send(config, data, function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        });
    });
    it("should use default middleware from unvalidated config, and error with bad token", function(done) {
        var config = {
            token: "token-goes-here"
        };

        var validatedConfig = splunklogging.validateConfig(config);

        var data = "something";

        splunklogging.send(config, data, function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(body.text, invalidTokenBody.text);
            assert.strictEqual(body.code, invalidTokenBody.code);
            done();
        });
    });
    it("should use default middleware from unvalidated config with valid token", function(done) {
        var config = {
            token: configurationFile.token,
            url: "https://localhost:8088/services/collector/event/1.0"
        };

        var data = "something";

        splunklogging.send(config, data, function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        });
    });
    it("should use non-default middleware", function(done) {
        var config = {
            token: "token-goes-here",
            middleware: function(config, data, callback) {
                assert.strictEqual(data, "something");

                data = splunklogging._makeBody(data);
                
                assert.strictEqual(config, validatedConfig);
                assert.strictEqual(Object.keys(data).length, 1);
                assert.strictEqual(data.event, "something");

                var response = {
                    headers: {
                        "content-type": "application/json; charset=UTF-8",
                        isCustom: true
                    }
                };
                callback(null, response, successBody);
            }
        };

        var validatedConfig = splunklogging.validateConfig(config);

        var data = "something";

        splunklogging.send(config, data, function(err, resp, body) {
            assert.ok(!err);
            assert.strictEqual(resp.headers["content-type"], "application/json; charset=UTF-8");
            assert.strictEqual(resp.headers.isCustom, true);
            assert.strictEqual(body.text, successBody.text);
            assert.strictEqual(body.code, successBody.code);
            done();
        });
    });
});