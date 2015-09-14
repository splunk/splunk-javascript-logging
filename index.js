var SplunkLogger = require("./splunklogger");
var utils = require("./utils");

// TODO: exports tag docs
module.exports = {
    Logger: SplunkLogger, // TODO: move SplunkLogger its own file
    utils: utils
};