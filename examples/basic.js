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

/**
 * This example shows basic usage of the SplunkLogger.
 */

// Change to require("splunk-logging").Logger;
var SplunkLogger = require("../index").Logger;

/**
 * Only the token property is required.
 * Defaults are listed explicitly.
 *
 * Alternatively, specify config.url like so:
 *
 * "https://localhost:8088/services/collector/event/1.0"
 */
var config = {
    token: "your-token-here",
    host: "localhost",
    path: "/services/collector/event/1.0",
    protocol: "https",
    port: 8088,
    level: "info",
    autoFlush: true,
    maxRetries: 0
};

// Create a new logger
var Logger = new SplunkLogger(config);

Logger.error = function(err, context) {
    // Handle errors here
    console.log("error", err, "context", context);
};

// Define the payload to send to Splunk's Event Collector
var payload = {
    // Message can be anything, doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    },
    // Metadata is optional
    metadata: {
        source: "chicken coop",
        sourcetype: "httpevent",
        index: "main",
        host: "farm.local",
    },
    // Severity is also optional
    severity: "info"
};

console.log("Sending payload", payload);
Logger.send(payload, function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});