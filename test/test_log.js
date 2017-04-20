var SplunkLogger = require("../index").Logger;
var assert = require("assert");
var sinon = require("sinon");

var payload = {};
var test_cb = function() {};
var logger = {};
var metadata = { host: 'test host' };


describe("SplunkLogger::Log", function() {
    beforeEach(function() {
        payload = { "test": "Sample Event" };
        logger = new SplunkLogger({token: "token-goes-here"});
        logger.send = sinon.spy();
    });

    describe(".set_metadata", function() {
        it("sets metadata", function() {
            logger.set_metadata(metadata);
            assert.strictEqual(logger.metadata, metadata);
        });
    });

    describe(".clear_metadata", function() {
        beforeEach(function() {
           logger.set_metadata(metadata);
        });

        it("clears metadata", function() {
            logger.clear_metadata(metadata);
            assert.strictEqual(logger.metadata, undefined);
        });
    });

    describe("._prep_context", function() {
        it("returns object with message and severity keys", function() {
            payload.metadata = {"host": "test host"};
            var context = logger._prep_context(payload, "nonstandard");
            assert.strictEqual(context.message, payload);
            assert.strictEqual(context.severity, "nonstandard");
        });

        it("returns object with message and severity keys", function() {
            payload.metadata = {"host": "test host"};
            var context = logger._prep_context(payload);
            assert.strictEqual(context.message, payload);
            assert.strictEqual(context.severity, undefined);
        });

    });

    describe(".log", function() {
        it("should call send with object", function() {
            logger.log(payload);
            assert.strictEqual(logger.send.args[0][0].message, payload);
        });

        it("should call send with string", function() {
            logger.log("test string");
            assert.strictEqual(logger.send.args[0][0].message, "test string");
        });

        it("should call send with array", function() {
            logger.log([1, 2, 3]);
            // to test equality of arrays need to convert to string
            assert.strictEqual(logger.send.args[0][0].message.toString, [1, 2, 3].toString);
        });

        it("should call send with number", function() {
            logger.log(1);
            assert.strictEqual(logger.send.args[0][0].message, 1);
        });

        it("should call send with callback", function() {
            logger.log(payload, test_cb);
            assert.strictEqual(logger.send.args[0][0].message, payload);
            assert.strictEqual(logger.send.args[0][1], test_cb);
        });
    });

    describe(".info", function() {
        it("should call send with object and append severity info", function() {
            logger.info(payload);
            assert.strictEqual(logger.send.args[0][0].message, payload);
            assert.strictEqual(logger.send.args[0][0].severity, "info");
        });
    });

    describe(".debug", function() {
        it("should call send with object and append severity debug", function() {
            logger.debug(payload);
            assert.strictEqual(logger.send.args[0][0].message, payload);
            assert.strictEqual(logger.send.args[0][0].severity, "debug");
        });
    });

    describe(".warn", function() {
        it("should call send with object and append severity warn", function() {
            logger.warn(payload);
            assert.strictEqual(logger.send.args[0][0].message, payload);
            assert.strictEqual(logger.send.args[0][0].severity, "warn");
        });
    });

    describe(".error", function() {
        it("should call send with object and append severity error", function() {
            logger.error(payload);
            assert.strictEqual(logger.send.args[0][0].message, payload);
            assert.strictEqual(logger.send.args[0][0].severity, "error");
        });
    });
});
