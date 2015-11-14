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
 * This example shows how to batch events with the
 * SplunkLogger with all available settings.
 *
 * By default autoFlush is enabled.
 *
 * By disabling autoFlush, events will be queued
 * until flush() is called.
 */

// Change to require("splunk-logging").Logger;
var SplunkLogger = require("../index").Logger;

/**
 * Only the token property is required.
 * 
 * Here, batchInterval is set to flush every 1
 * second, when 10 events are queued, or
 * when the size of queued events totals
 * more than 1kb.
 */
var config = {
    token: "your-token",
    url: "https://localhost:8088",
    batchInterval: 1000,
    maxBatchCount: 10,
    maxBatchSize: 1024 // 1kb
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

console.log("Queuing payload", payload);
// Don't need a callback here
Logger.send(payload);

var payload2 = {
    message: {
        temperature: "75F",
        chickenCount: 600,
        note: "New chickens have arrived"
    },
    metadata: payload.metadata
};

console.log("Queuing second payload", payload2);
// Don't need a callback here
Logger.send(payload2);

/**
 * Since we've configured autoFlush, we don't need
 * to do anything at this point. Events will
 * will be sent to Splunk automatically based
 * on the batching settings above.
 */

// Kill the process
var p = process;
setTimeout(function() {
    console.log("Events should be in Splunk! Exiting...");
    // p.exit();
    process.exit();
}, 2000);