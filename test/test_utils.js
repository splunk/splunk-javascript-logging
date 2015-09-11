var assert = require("assert");
var utils = require("../index").utils;

describe("Utils", function() {
    describe("formatTime", function () {
        it("should correctly handle false values", function() {
            assert.strictEqual(utils.formatTime(undefined), null);

            assert.strictEqual(utils.formatTime(null), null);

            assert.strictEqual(utils.formatTime(false), null);

            assert.ok(isNaN(utils.formatTime(true)));
        });
        it("should correctly handle Date objects", function() {
            var now = Date.now();
            var expected = (now / 1000).toFixed(3);
            var found = utils.formatTime(now);
            assert.strictEqual(found, expected);

            var old = new Date(1372187084);
            var oldExpected = (1372187084000 / 1000).toFixed(3);
            var oldFound = utils.formatTime(old);
            assert.strictEqual(oldFound, oldExpected);

            var other = Date.parse("2014-04-11T19:41:32Z");
            var otherExpected = (1397245292000 / 1000).toFixed(3);
            var otherFound = utils.formatTime(other);
            assert.strictEqual(otherFound, otherExpected);
        });
        // TODO: change these to be strictequal?
        it("should correctly handle Strings", function() {
            // Test time in seconds
            var stringTime = "1372187084";
            var expected = 1372187084.000;
            var found = utils.formatTime(stringTime);
            assert.equal(found, expected);

            // Test a super small time, 4 seconds since the epoch
            var tinyStringTime = "4";
            expected = 4.000;
            found = utils.formatTime(tinyStringTime);
            assert.equal(found, expected);

            // Test the time in milliseconds
            var milliStringTime = "1372187084000";
            expected = 1372187084.000;
            found = utils.formatTime(milliStringTime);
            assert.equal(found, expected);

            // Test a huge integer value, just get the first 14 digits
            var hugeStringTime = "13721870840001234";
            expected = 1372187084.000;
            found = utils.formatTime(hugeStringTime);
            assert.equal(found, expected);

            // Test a value starting with zeros
            var leadingZeroStringTime = "000000000137218.442";
            expected = 137218.442;
            found = utils.formatTime(leadingZeroStringTime);
            assert.equal(found, expected);
        });
        it("should correctly handle whole Numbers", function() {
            // Test time in seconds
            var intTime = 1372187084;
            var expected = 1372187084.000;
            var found = utils.formatTime(intTime);
            assert.equal(found, expected);

            // Test a super small time, 4 seconds since the epoch
            var tinyIntTime = 4;
            expected = 4.000;
            found = utils.formatTime(tinyIntTime);
            assert.equal(found, expected);

            // Test the time in milliseconds
            var milliIntTime = 1372187084000;
            expected = 1372187084.000;
            found = utils.formatTime(milliIntTime);
            assert.equal(found, expected);

            // Test a huge integer value, just get the first 14 digits
            var hugeIntTime = 13721870840001234;
            expected = 1372187084.000;
            found = utils.formatTime(hugeIntTime);
            assert.equal(found, expected);
        });
        it("should correctly handle float Numbers", function() {
            // Test a perfect value
            var floatTime = 1372187084.424;
            var expected = 1372187084.424;
            var found = utils.formatTime(floatTime);
            assert.equal(found, expected);

            // Test a really long decimal value
            var longDecimalFloatTime = 1372187084.424242425350823423423;
            expected = 1372187084.424;
            found = utils.formatTime(longDecimalFloatTime);
            assert.equal(found, expected);

            // Test a date far into the future
            var crazyFloatTime = 13721874084.424242425350823423423;
            expected = 13721874084.420;
            found = utils.formatTime(crazyFloatTime);
            assert.equal(found, expected);

            // Test a really really far into the future
            var crazyFloatTime2 = 1372187084555.424242425350823423423;
            expected = 1372187084555.000;
            found = utils.formatTime(crazyFloatTime2);
            assert.equal(found, expected);

            // Test a slightly crazy value
            var crazyFloatTime3 = 137218.424242425350823423423;
            expected = 137218.424;
            found = utils.formatTime(crazyFloatTime3);
            assert.equal(found, expected);

            // Test a tiny value
            var crazyFloatTime5 = 4.001234235;
            expected = 4.001;
            found = utils.formatTime(crazyFloatTime5);
            assert.equal(found, expected);

            var crazyFloatTime6 = 40012342.001234235;
            expected = 40012342.001;
            found = utils.formatTime(crazyFloatTime6);
            assert.equal(found, expected);

            var crazyFloatTime7 = 4001234240012342.1234;
            expected = 4001234240.012;
            found = utils.formatTime(crazyFloatTime7);
            assert.equal(found, expected);
        });
    });
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