var utils = {};

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