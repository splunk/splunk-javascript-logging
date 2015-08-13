var splunklogging = require("../index");

module.exports = {
    "error on no config": function(test) {
        try {
            splunklogging.validateConfiguration();
            test.fail();    
        }
        catch (err) {
            test.ok(err);
            test.strictEqual(err.message, "Configuration is required.");
        }
        test.done();
    },
    "error with undefined config": function(test) {
        var config;
        try {
            splunklogging.validateConfiguration(config);
            test.fail();    
        }
        catch (err) {
            test.ok(err);
            test.strictEqual(err.message, "Configuration is required.");
        }
        test.done();
    },
    "error with null config": function(test) {
        var config = null;
        try {
            splunklogging.validateConfiguration(config);
            test.fail();    
        }
        catch (err) {
            test.ok(err);
            test.strictEqual(err.message, "Configuration is required.");
        }
        test.done();
    },
    "error with non-string token in config": function(test) {
        var config = {
            token: {}
        };
        try {
            splunklogging.validateConfiguration(config);
            test.fail();    
        }
        catch (err) {
            test.ok(err);
            test.strictEqual(err.message, "Configuration token must be a string.");
        }
        test.done();
    },
    "error with NaN port": function(test) {
        var config = {
            token: "a-token-goes-here-usually",
            port: "this isn't a port"
        };

        try {
            splunklogging.validateConfiguration(config);
            test.fail();    
        }
        catch (err) {
            test.ok(err);
            test.strictEqual(err.message, "Port must be an integer, found: NaN");
        }
        test.done();
    },
    "set default config with token only config": function(test) {
        var config = {
            token: "a-token-goes-here-usually"
        };
        var validatedConfig = splunklogging.validateConfiguration(config);

        test.ok(validatedConfig);
        test.strictEqual(config.token, validatedConfig.token);
        test.strictEqual("splunk-javascript-logging", validatedConfig.name);
        test.strictEqual("localhost", validatedConfig.host);
        test.strictEqual("/services/collector/event/1.0", validatedConfig.url);
        test.strictEqual(true, validatedConfig.useHTTPS);
        test.strictEqual(false, validatedConfig.strictSSL);
        test.strictEqual("info", validatedConfig.level);
        test.strictEqual(8088, validatedConfig.port);
        test.done();
    },
    "set non-default boolean config values": function(test) {
        var config = {
            token: "a-token-goes-here-usually",
            useHTTPS: false,
            strictSSL: true
        };
        var validatedConfig = splunklogging.validateConfiguration(config);

        test.strictEqual(config.token, validatedConfig.token);
        test.strictEqual("splunk-javascript-logging", validatedConfig.name);
        test.strictEqual("localhost", validatedConfig.host);
        test.strictEqual("/services/collector/event/1.0", validatedConfig.url);
        test.strictEqual(false, validatedConfig.useHTTPS);
        test.strictEqual(true, validatedConfig.strictSSL);
        test.strictEqual("info", validatedConfig.level);
        test.strictEqual(8088, validatedConfig.port);
        test.done();
    },
    "set non-default url": function(test) {
        var config = {
            token: "a-token-goes-here-usually",
            url: "/something/different/here/1.0"
        };
        var validatedConfig = splunklogging.validateConfiguration(config);

        test.ok(validatedConfig);
        test.strictEqual(config.token, validatedConfig.token);
        test.strictEqual("splunk-javascript-logging", validatedConfig.name);
        test.strictEqual("localhost", validatedConfig.host);
        test.strictEqual(config.url, validatedConfig.url);
        test.strictEqual(true, validatedConfig.useHTTPS);
        test.strictEqual(false, validatedConfig.strictSSL);
        test.strictEqual("info", validatedConfig.level);
        test.strictEqual(8088, validatedConfig.port);
        test.done();
    },
    "set non-default port": function(test) {
        var config = {
            token: "a-token-goes-here-usually",
            port: 1234
        };
        var validatedConfig = splunklogging.validateConfiguration(config);

        test.ok(validatedConfig);
        test.strictEqual(config.token, validatedConfig.token);
        test.strictEqual("splunk-javascript-logging", validatedConfig.name);
        test.strictEqual("localhost", validatedConfig.host);
        test.strictEqual("/services/collector/event/1.0", validatedConfig.url);
        test.strictEqual(true, validatedConfig.useHTTPS);
        test.strictEqual(false, validatedConfig.strictSSL);
        test.strictEqual("info", validatedConfig.level);
        test.strictEqual(config.port, validatedConfig.port);
        test.done();
    }
};