/*
 * Copyright 2015 Splunk, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"): you may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

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
    describe("chain", function () {
        it("should succeed with 3 callbacks, passing a single argument through the chain", function(done) {
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
        it("should succeed with flat callbacks, passing a single argument through the chain", function(done) {
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
        it("should succeed with flat callbacks, passing multiple arguments through the chain", function(done) {
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
        it("should succeed with flat callbacks, appending an argument in the middle of the chain", function(done) {
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
        it("should surface error from middle of the chain", function(done) {
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
        it("should be noop without task callbacks", function(done) {
            utils.chain([],
                function(err, val1, val2) {
                    assert.ok(!err);
                    assert.ok(!val1);
                    assert.ok(!val2);
                    done();
                }
            );
        });
        it("should be noop without args", function() {
            utils.chain();
        });
        it("should surface error from first callback in the chain", function(done) {
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
    describe("whilst", function() {
        it("should succeed with short counting loop", function(done) {
            var i = 0;
            utils.whilst(
                function() { return i++ < 3; },
                function(callback) {
                    setTimeout(function() { callback(); }, 0);
                },
                function(err) {
                    assert.ok(!err);
                    assert.strictEqual(i, 4);
                    done();
                }
            );
        });
        it("should succeed with long counting loop", function(done) {
            var i = 0;
            utils.whilst(
                function() { return i++ < 1000; },
                function(callback) {
                    setTimeout(function() { callback(); }, 0);
                },
                function(err) {
                    assert.ok(!err);
                    assert.strictEqual(i, 1001);
                    done();
                }
            );
        });
        it("should pass error to callback function", function(done) {
            var i = 0;
            utils.whilst(
                function() { return i++ < 1000; },
                function(callback) {
                    setTimeout(function() { callback(i === 1000 ? 1 : null); }, 0);
                },
                function(err) {
                    assert.ok(err);
                    assert.strictEqual(err, 1);
                    // Don't execute condition function 1 extra time like above
                    assert.strictEqual(i, 1000);
                    done();
                }
            );
        });
        it("should never enter loop body when condition loop returns false (default)", function(done) {
            var i = false;
            utils.whilst(
                undefined,
                function(callback) { i = true; callback(); },
                function(err) {
                    assert.ok(!err);
                    assert.strictEqual(i, false);
                    done();
                }
            );
        });
        it("should be noop with noop loop body", function(done) {
            var i = true;
            utils.whilst(
                function() {
                    if (i) {
                        i = false;
                        return true;
                    }
                    else {
                        return i;
                    }
                },
                undefined,
                function (err) {
                    assert.ok(!err);
                    done();
                }
            );
        });
        it("should succeed with short counting loop, without done callback", function(done) {
            var i = 0;
            utils.whilst(
                function() { return i++ < 3; },
                function(callback) {
                    setTimeout(function() { callback(); }, 0);
                }
            );

            setTimeout(function(){
                if (i !== 4) {
                    assert.ok(false, "test timed out");
                }
                done();
            }, 10);
        });
    });
    describe("expBackoff", function() {
        it("should error with bad param", function(done) {
            utils.expBackoff(null, function(err, timeout) {
                assert.ok(err);
                assert.strictEqual(err.message, "Must send opts as an object.");
                assert.ok(!timeout);
                done();
            });
        });
        it("should error with missing opts.attempt", function(done) {
            utils.expBackoff({foo: 123}, function(err, timeout) {
                assert.ok(err);
                assert.strictEqual(err.message, "Must set opts.attempt.");
                assert.ok(!timeout);
                done();
            });
        });
        it("should have backoff in [20, 40]ms, attempt = 1", function(done) {
            utils.expBackoff({attempt: 1}, function(err, timeout) {
                assert.ok(!err);
                assert.ok(20 <= timeout && timeout <= 40);
                done();
            });
        });
        it("should have backoff in [40, 80]ms, attempt = 2", function(done) {
            utils.expBackoff({attempt:  2}, function(err, timeout) {
                assert.ok(!err);
                assert.ok(40 <= timeout && timeout <= 80);
                done();
            });
        });
        it("should have backoff in [80, 160]ms, attempt = 3", function(done) {
            utils.expBackoff({attempt: 3}, function(err, timeout) {
                assert.ok(!err);
                assert.ok(80 <= timeout && timeout <= 160);
                done();
            });
        });
        it("should have backoff in [160, 320]ms, attempt = 4", function(done) {
            utils.expBackoff({attempt: 4}, function(err, timeout) {
                assert.ok(!err);
                assert.ok(160 <= timeout && timeout <= 320);
                done();
            });
        });
        it("should have backoff in [320, 640]ms, attempt = 5", function(done) {
            utils.expBackoff({attempt: 5}, function(err, timeout) {
                assert.ok(!err);
                assert.ok(320 <= timeout && timeout <= 640);
                done();
            });
        });
        it("should have backoff of 40ms, attempt = 2, rand = 0", function(done) {
            utils.expBackoff({attempt: 2, rand: 0}, function(err, timeout) {
                assert.ok(!err);
                assert.strictEqual(40, timeout);
                done();
            });
        });
        it("should have backoff of 80ms, attempt = 2, rand = 1", function(done) {
            utils.expBackoff({attempt: 2, rand: 1}, function(err, timeout) {
                assert.ok(!err);
                assert.strictEqual(80, timeout);
                done();
            });
        });
        it("should have backoff of 80ms, attempt = 2, rand = 1 - no done callback", function(done) {
            utils.expBackoff({attempt: 2, rand: 1});
            setTimeout(done, 80);
        });
        // TODO: this test is takes 2 minutes, rest of the tests take 12s combined...
        // it("should have maximum backoff of 2m (slow running test)", function(done) {
        //     this.timeout(1000 * 60 * 2 + 500);
        //     utils.expBackoff({attempt: 100, rand: 0}, function(err, timeout) {
        //         assert.strictEqual(120000, timeout);
        //         done();
        //     });
        // });
    });
    describe("bind", function() {
        it("should successfully bind a function", function(done) {
            var f;
            (function() {
                f = function(a) {
                    this.a = a;
                };
            })();
            var q = {};
            var g = utils.bind(q, f);
            g(12);
            assert.strictEqual(q.a, 12);
            done();
        });
    });
    describe("copyObject", function() {
        it("should copy a 5 property object", function() {
            var o = {
                a: 1,
                b: 2,
                c: 3,
                d: 4,
                e: 5,
            };

            var copy = o;
            
            // Pointing to the same memory block
            assert.strictEqual(copy, o);

            // Verify it was a real copy
            copy = utils.copyObject(o);
            assert.notStrictEqual(copy, o);
            assert.strictEqual(Object.keys(copy).length, 5);
            assert.strictEqual(copy.a, o.a);
            assert.strictEqual(copy.b, o.b);
            assert.strictEqual(copy.c, o.c);
            assert.strictEqual(copy.d, o.d);
            assert.strictEqual(copy.e, o.e);

            // Verify changing original object vals doesn't change copy's vals
            for (var k in o) {
                if (o.hasOwnProperty(k)){
                    o[k]++;
                }
            }
            assert.notStrictEqual(copy.a, o.a);
            assert.notStrictEqual(copy.b, o.b);
            assert.notStrictEqual(copy.c, o.c);
            assert.notStrictEqual(copy.d, o.d);
            assert.notStrictEqual(copy.e, o.e);

        });
    });
    describe("copyArray", function() {
        it("should copy a 5 element array", function() {
            var a = [0, 1, 2, 3, 4];

            var copy = a;
            
            // Pointing to the same memory block
            assert.strictEqual(copy, a);

            // Verify it was a real copy
            copy = utils.copyArray(a);
            assert.notStrictEqual(copy, a);
            assert.strictEqual(Object.keys(copy).length, 5);
            assert.strictEqual(copy[0], a[0]);
            assert.strictEqual(copy[1], a[1]);
            assert.strictEqual(copy[2], a[2]);
            assert.strictEqual(copy[3], a[3]);
            assert.strictEqual(copy[4], a[4]);

            // Verify changing original array vals doesn't change copy's vals
            for (var k in a) {
                    a[k]++;
            }
            assert.notStrictEqual(copy[0], a[0]);
            assert.notStrictEqual(copy[1], a[1]);
            assert.notStrictEqual(copy[2], a[2]);
            assert.notStrictEqual(copy[3], a[3]);
            assert.notStrictEqual(copy[4], a[4]);

        });
    });
    describe("orByProp", function() {
        it("should pick first value of 2", function() {
            var a = {
                x: "x value"
            };
            var b = {
                y: "y value"
            };

            assert.strictEqual(utils.orByProp("x", a, b), "x value");
            assert.strictEqual(utils.orByProp("y", b, a), "y value");
        });
        it("should pick second value of 2, when first is undefined", function() {
            var a = {
                x: "x value"
            };
            var b = {
                y: "y value"
            };

            assert.strictEqual(utils.orByProp("x", b, a), "x value");
            assert.strictEqual(utils.orByProp("y", a, b), "y value");
        });
    });
    describe("orByBooleanProp", function() {
        it("should pick first value of 2", function() {
            var a = {
                x: false
            };
            var b = {
                y: true
            };

            assert.strictEqual(utils.orByBooleanProp("x", a, b), false);
            assert.strictEqual(utils.orByBooleanProp("y", b, a), true);
        });
        it("should pick second value of 2", function() {
            var a = {
                x: false
            };
            var b = {
                y: true
            };

            assert.strictEqual(utils.orByBooleanProp("x", b, a), false);
            assert.strictEqual(utils.orByBooleanProp("y", a, b), true);
        });
    });
    describe("validateNonNegativeInt", function() {
        it("should error when value is NaN", function() {
            try {
                utils.validateNonNegativeInt(null, "test");
                assert.ok(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "test must be a number, found: NaN");
            }
        });
        it("should error when value is negative", function() {
            try {
                utils.validateNonNegativeInt(-1, "test");
                assert.ok(false, "Expected an error.");
            }
            catch (err) {
                assert.ok(err);
                assert.strictEqual(err.message, "test must be a positive number, found: -1");
            }
        });
        it("should return the value when it's 0", function() {
            var valid = utils.validateNonNegativeInt(0, "test");
            assert.strictEqual(valid, 0);
        });
        it("should return the value when it's positive", function() {
            var valid = utils.validateNonNegativeInt(5, "test");
            assert.strictEqual(valid, 5);
        });
    });
});