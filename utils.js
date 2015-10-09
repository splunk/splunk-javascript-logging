/**
 * Utility functions.
 * @exports utils
 */
var utils = {};
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


/* Utility Functions */

/**
 * Formats the time for Splunk as a the epoch time in seconds.
 *
 * @param {(string|number|date)} time - A date string, timestamp, or <code>Date</code> object.
 * @returns {number|null} Epoch time in seconds, or <code>null</code> if <code>time</code> is malformed.
 * @static
 */
utils.formatTime = function(time) {
    var cleanTime;
    
    // If time is a Date object, return its value.
    if (time instanceof Date) {
        time = time.valueOf();
    }

    if (!time || time === null) {
        return null;
    }

    // Values with decimals
    if (time.toString().indexOf(".") !== -1) {
        cleanTime = parseFloat(time).toFixed(3); // Clean up the extra decimals right away.

        // A perfect time in milliseconds, with the decimal in the right spot.
        if (cleanTime.toString().indexOf(".") >= 10) {
            cleanTime = parseFloat(cleanTime.toString().substring(0, 14)).toFixed(3);
        }
    }
    // Values without decimals
    else {
        // A time in milliseconds, no decimal (ex: Date.now()).
        if (time.toString().length === 13) {
            cleanTime = (parseFloat(time) / 1000).toFixed(3);
        }
        // A time with fewer than expected digits.
        else if (time.toString().length <= 12) {
            cleanTime = parseFloat(time).toFixed(3);
        }
        // Any other value has more digits than the expected time format, get the first 14.
        else {
            cleanTime = parseFloat(time.toString().substring(0, 13)/1000).toFixed(3);
        }
    }
    return cleanTime;
};

/**
 * Converts an iterable into to an array.
 *
 * @param {(Array|Object)} iterable - Thing to convert to an <code>Array</code>.
 * @returns {Array}
 * @static
 */
utils.toArray = function(iterable) {
    return Array.prototype.slice.call(iterable);
};

/**
 * Run async function in a chain, like {@link https://github.com/caolan/async#waterfall|Async.waterfall}.
 *
 * @param {(function[]|function)} tasks - <code>Array</code> of callback functions.
 * @param {function} [callback] - Final callback.
 * @static
 */
utils.chain = function(tasks, callback) {
    // Allow for just a list of functions
    if (arguments.length > 1 && typeof arguments[0] === "function") {
        var args = utils.toArray(arguments);
        tasks = args.slice(0, args.length - 1);
        callback = args[args.length - 1];
    }

    tasks = tasks || [];
    callback = callback || function() {};

    if (tasks.length === 0) {
        callback();
    }
    else {
        var nextTask = function(task, remainingTasks, result) {
            var taskCallback = function(err) {
                if (err) {
                    callback(err);
                }
                else {
                    var args = utils.toArray(arguments);
                    args.shift();
                    nextTask(remainingTasks[0], remainingTasks.slice(1), args);
                }
            };

            var args = result;
            if (remainingTasks.length === 0) {
                args.push(callback);
            }
            else {
                args.push(taskCallback);
            }

            task.apply(null, args);
        };

        nextTask(tasks[0], tasks.slice(1), []);
    }
};

/**
 * Asynchronous while loop.
 *
 * @param {function} [condition] - A function returning a boolean, the loop condition.
 * @param {function} [body] - A function, the loop body.
 * @param {function} [callback] - Final callback.
 * @static
 */
utils.whilst = function (condition, body, callback) {
    condition = condition || function() { return false; };
    body = body || function(done){ done(); };
    callback = callback || function() {};

    var wrappedCallback = function(err) {
        if (err) {
            callback(err);
        }
        else {
            utils.whilst(condition, body, callback);
        }
    };

    if (condition()) {
        body(wrappedCallback);
    }
    else {
        callback(null);
    }
};

/**
 * Waits using exponential backoff.
 *
 * @param {object} [opts] - Settings for this function. Expected keys: attempt, rand.
 * @param {function} [callback] - A callback function: <code>function(err, timeout)</code>.
 */
utils.expBackoff = function(opts, callback) {
    callback = callback || function(){};
    if (!opts || typeof opts !== "object") {
        callback(new Error("Must send opts as an object."));
    }
    else if (opts && !opts.hasOwnProperty("attempt")) {
        callback(new Error("Must set opts.attempt."));
    }
    else {

        var min = 10;
        var max = 1000 * 60 * 2; // TODO: is 2 minutes a reasonable max timeout?

        var rand = Math.random();
        if (opts.hasOwnProperty("rand")) {
            rand = opts.rand;
        }
        rand++;

        var timeout = Math.round(rand * min * Math.pow(2, opts.attempt));

        timeout = Math.min(timeout, max);
        setTimeout(
            function() {
                callback(null, timeout);
            },
            timeout
        );
    }
};

module.exports = utils;