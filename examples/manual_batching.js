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
 * SplunkLogger by manually calling flush.
 *
 * By setting maxbatchCount=0, events will be queued
 * until flush() is called.
 */

// Change to require("splunk-logging").Logger;
var SplunkLogger = require("../index").Logger;

/**
 * Only the token property is required.
 * 
 * Here, maxBatchCount is set to 0.
 */
var config = {
    token: "your-token-here",
    url: "https://localhost:8088",
    maxBatchCount: 0 // Manually flush events
};

// Create a new logger
var Logger = new SplunkLogger(config);

Logger.onError = function(err, context) {
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
        host: "farm.local"
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
 * Call flush manually.
 * This will send both payloads in a single
 * HTTP request.
 *
 * The same callback can work for send() and flush().
 */
Logger.flush(function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});