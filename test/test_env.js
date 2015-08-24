var assert = require("assert");

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = require("./config.json");

describe("Environment Tests", function() {
    describe("config.json (test config file)", function() {
        it("should at least have a token", function() {
            assert.ok(configurationFile);
            assert.ok(configurationFile.hasOwnProperty("token"));
            assert.ok(configurationFile.token.length > 0);
        });
    });
});