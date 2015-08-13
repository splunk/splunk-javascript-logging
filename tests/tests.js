var test = require("nodeunit").reporters.default;
var path = require("path");

test.run([
    path.resolve("tests/test_config.js")
]);