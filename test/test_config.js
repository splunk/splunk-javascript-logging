var splunklogging = require("../index");
var assert = require("assert");

describe("validateConfiguration", function () {
    it("should error on no config", function() {
        try {
            splunklogging.validateConfiguration();
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Configuration is required.");
        }
    });
    it("should error with undefined config", function() {
        var config;
        try {
            splunklogging.validateConfiguration(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Configuration is required.");
        }
    });
    it("should error with null config", function() {
        var config = null;
        try {
            splunklogging.validateConfiguration(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Configuration is required.");
        }
    });
    it("should error with non-string token in config", function() {
        var config = {
            token: {}
        };
        try {
            splunklogging.validateConfiguration(config);
            assert.fail(false, "Expected an error.");
        }
        catch (err) {
            assert.ok(err);
            assert.strictEqual(err.message, "Configuration token must be a string.");
        }
    });
    it("should error with NaN port", function() {
        var config = {
            token: "a-token-goes-here-usually",
            port: "this isn't a port"
        };

        try {
            splunklogging.validateConfiguration(config);
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
        var validatedConfig = splunklogging.validateConfiguration(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.url);
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
        var validatedConfig = splunklogging.validateConfiguration(config);

        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.url);
        assert.strictEqual(false, validatedConfig.useHTTPS);
        assert.strictEqual(true, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(8088, validatedConfig.port);
    });
    it("should set non-default url", function() {
        var config = {
            token: "a-token-goes-here-usually",
            url: "/something/different/here/1.0"
        };
        var validatedConfig = splunklogging.validateConfiguration(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual(config.url, validatedConfig.url);
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
        var validatedConfig = splunklogging.validateConfiguration(config);

        assert.ok(validatedConfig);
        assert.strictEqual(config.token, validatedConfig.token);
        assert.strictEqual("splunk-javascript-logging", validatedConfig.name);
        assert.strictEqual("localhost", validatedConfig.host);
        assert.strictEqual("/services/collector/event/1.0", validatedConfig.url);
        assert.strictEqual(true, validatedConfig.useHTTPS);
        assert.strictEqual(false, validatedConfig.strictSSL);
        assert.strictEqual("info", validatedConfig.level);
        assert.strictEqual(config.port, validatedConfig.port);
    });
});