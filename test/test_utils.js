var assert = require("assert");
var utils = require("../utils");

describe("Utils", function() {
    describe("toArray", function () {
        it("should make function arguments into an array", function() {
            function testToArray() {
                var found = utils.toArray(arguments);
                var expected = [1, 2, 3, 4, 5];
                for (var i = 0; i < found.length; i++) {
                    assert.strictEqual(found[i], expected[i]);
                }
            }
            testToArray(1, 2, 3, 4, 5);
        });
    });
    describe("isArray", function () {
        it("should return true for empty array", function() {
            assert.ok(utils.isArray([]));
        });
        it("should return true for 1 element array", function() {
            assert.ok(utils.isArray([1]));
        });
        it("should return true for 2 element array", function() {
            assert.ok(utils.isArray([1, 2]));
        });
        it("should return false for null", function() {
            assert.ok(!utils.isArray(null));
        });
        it("should return false for no argument", function() {
            assert.ok(!utils.isArray());
        });
    });
    // TODO: rename these tests to the "should..." format
    describe("chain", function () {
        it("single success", function(done) {
            utils.chain([
                function(callback) {
                    callback(null, 1);
                },
                function(val, callback) {
                    callback(null, val + 1);
                },
                function(val, callback) {
                    callback(null, val + 1);
                }],
                function(err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val, 3);
                    done();
                }
            );
        });
        it("flat single success", function(done) {
            utils.chain(
                function(callback) {
                    callback(null, 1);
                },
                function(val, callback) {
                    callback(null, val + 1);
                },
                function(val, callback) {
                    callback(null, val + 1);
                },
                function(err, val) {
                    assert.ok(!err);
                    assert.strictEqual(val, 3);
                    done();
                }
            );
        });
        it("flat multiple success", function(done) {
            utils.chain(
                function(callback) {
                    callback(null, 1, 2);
                },
                function(val1, val2, callback) {
                    callback(null, val1 + 1, val2 + 1);
                },
                function(val1, val2, callback) {
                    callback(null, val1 + 1, val2 + 1);
                },
                function(err, val1, val2) {
                    assert.ok(!err);
                    assert.strictEqual(val1, 3);
                    assert.strictEqual(val2, 4);
                    done();
                }
            );
        });
        it("flat add args success", function(done) {
            utils.chain(
                function(callback) {
                    callback(null, 1, 2);
                },
                function(val1, val2, callback) {
                    callback(null, val1 + 1);
                },
                function(val1, callback) {
                    callback(null, val1 + 1, 5);
                },
                function(err, val1, val2) {
                    assert.ok(!err);
                    assert.strictEqual(val1, 3);
                    assert.strictEqual(val2, 5);
                    done();
                }
            );
        });
        it("error", function(done) {
            utils.chain([
                function(callback) {
                    callback(null, 1, 2);
                },
                function(val1, val2, callback) {
                    callback(5, val1 + 1);
                },
                function(val1, callback) {
                    callback(null, val1 + 1, 5);
                }],
                function(err, val1, val2) {
                    assert.ok(err);
                    assert.ok(!val1);
                    assert.ok(!val2);
                    assert.strictEqual(err, 5);
                    done();
                }
            );
        });
        it("no tasks", function(done) {
            utils.chain([],
                function(err, val1, val2) {
                    assert.ok(!err);
                    assert.ok(!val1);
                    assert.ok(!val2);
                    done();
                }
            );
        });
        it("no args", function() {
            utils.chain();
        });
        it("no final callback", function(done) {
            utils.chain([
                function(callback) {
                    callback("err");
                }],
                function(err) {
                    assert.ok(err);
                    done();
                }
            );
        });
    });
});