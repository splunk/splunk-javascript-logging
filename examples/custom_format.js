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
 * This example shows how to use a custom event format for SplunkLogger.
 */

// Change to require("splunk-logging").Logger;
var SplunkLogger = require("../index").Logger;

/**
 * Only the token property is required.
 */
var config = {
    token: "your-token-here",
    url: "https://localhost:8088"
};

// Create a new logger
var Logger = new SplunkLogger(config);

Logger.error = function(err, context) {
    // Handle errors here
    console.log("error", err, "context", context);
};

/**
 * Override the default eventFormatter() function,
 * which takes a message and severity, returning
 * any type; string or object are recommended.
 *
 * The message parameter can be any type. It will
 * be whatever was passed to Logger.send().
 * Severity will always be a string.
 *
 * In this example, we're building up a string
 * of key=value pairs if message is an object,
 * otherwise the message value is as value for
 * the message key.
 * 
 * This string is prefixed with the event
 * severity in square brackets.
 */
Logger.eventFormatter = function(message, severity) {
    var event = "[" + severity + "]";

    if (typeof message === "object") {
        for (var key in message) {
            event += key + "=" + message[key] + " ";
        }
    }
    else {
        event += "message=" + message;
    }

    return event;
};

// Define the payload to send to HTTP Event Collector
var payload = {
    // Message can be anything, it doesn't have to be an object
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
        fields: {
            device: "001",
            sensors: [
                "s44",
                "s657"
            ]
        },
    },
    // Severity is also optional
    severity: "info"
};

console.log("Sending payload", payload);

/**
 * Since maxBatchCount is set to 1 by default,
 * calling send will immediately send the payload.
 * 
 * The underlying HTTP POST request is made to
 *
 *     https://localhost:8088/services/collector/event/1.0
 *
 * with the following body
 *
 *     {
 *         "source": "chicken coop",
 *         "sourcetype": "httpevent",
 *         "index": "main",
 *         "host": "farm.local",
 *         "fields": {
 *             "device": "001",
 *             "sensors": ["s44", "s657"]
 *         },
 *         "event": "[info]temperature=70F chickenCount=500 "
 *     }
 *
 */
Logger.send(payload, function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});
