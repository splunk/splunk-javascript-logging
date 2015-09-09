var utils = {};

/**
 * TODO: docs
 *
 * returns a number of epoch seconds
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
            cleanTime = parseFloat(cleanTime.toString().substring(0,14)).toFixed(3);
        }
    }
    // Values without decimals
    else {
        // A time in milliseconds, no decimal (ex: Date.now()).
        if (time.toString().length === 13) {
            cleanTime = (parseFloat(time)/1000).toFixed(3);
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
 * TODO: docs
 * Converts an iterable to an array
 */
utils.toArray = function(iterable) {
    return Array.prototype.slice.call(iterable);
};

/**
 * TODO: docs
 * Run async function in a chain, like Async.waterfall
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

module.exports = utils;