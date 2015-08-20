var splunklogging = require("../index");
var assert = require("assert");

describe("validateConfig", function () {
    it("should error on no config", function() {
        try {
            splunklogging.validateConfig();
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
            splunklogging.validateConfig(config);
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
            splunklogging.validateConfig(config);
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
            splunklogging.validateConfig(config);
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
            splunklogging.validateConfig(config);
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
            splunklogging.validateConfig(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Config token must be a string.");
        }
    });
    it("should error with non-function middleware in config", function() {
        var config = {
            token: "a-token-goes-here-usually",
            middleware: "this is not a function"
        };
        try {
            splunklogging.validateConfig(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Config middleware must be a function.");
        }
    });
    it("should error with NaN port", function() {
        var config = {
            token: "a-token-goes-here-usually",
            port: "this isn't a port"
        };

        try {
            splunklogging.validateConfig(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Port must be an integer, found: NaN");
        }
    });
    it("should set default config with token only config", function() {
        var config = {
            token: "a-token-goes-here-usually"
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.path);
        assert.strictEqual(true, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(splunklogging.levels.info, validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
    it("should set non-default boolean config values", function() {
        var config = {
            token: "a-token-goes-here-usually",
            useHTTPS: false,
            strictSSL: true
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.path);
        assert.strictEqual(false, validatedConfig.useHTTPS);
        assert.strictEqual(true, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
    it("should set non-default path", function() {
        var config = {
            token: "a-token-goes-here-usually",
            path: "/something/different/here/1.0"
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual(config.path, validatedConfig.path);
        assert.strictEqual(true, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
    it("should set non-default port", function() {
        var config = {
            token: "a-token-goes-here-usually",
            port: 1234
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.path);
        assert.strictEqual(true, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(config.port, validatedConfig.port);
    });
    it("should set scheme, host, port & path from url property", function() {
        var config = {
            token: "a-token-goes-here-usually",
            url: "http://splunk.local:9088/services/collector/different/1.0"
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("splunk.local", validatedConfig.host);
        assert.strictEqual("/services/collector/different/1.0", validatedConfig.path);
        assert.strictEqual(false, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(9088, validatedConfig.port);
    });
    it("should set scheme from url property", function() {
        var config = {
            token: "a-token-goes-here-usually",
            url: "http:"
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.path);
        assert.strictEqual(false, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
    it("should set host from url property with host only", function() {
        var config = {
            token: "a-token-goes-here-usually",
            url: "splunk.local"
        };
        var validatedConfig = splunklogging.validateConfig(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging/0.8.0", validatedConfig.name);
        assert.strictEqual("splunk.local", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.path);
        assert.strictEqual(true, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
});