# Splunk Logging Library for JavaScript (beta)

#### Version 0.9.0

This project provides a simple interface for logging to Splunk's Event Collector.

## Requirements

* Splunk 6.3+.
* An HTTP Event Collector token from your Splunk server.
* Node.js v0.10+.

## Installation

If you already have Node.js and npm installed, simply run: `npm install --save splunk-logging`.

## Usage

See the `examples` folder for more examples:

* `all_batching.js`: shows how to configure a logger with the 3 batching settings: `batchInterval`, `maxBatchCount`, & `maxBatchSize`.
* `basic.js`: shows how to configure a logger and send a log message to Splunk.
* `custom_format.js`: shows how to configure a logger so log message to Splunk using a custom format.
* `manual_batching.js`: shows how to queue log messages, and send them in batches by manually calling `flush()`.
* `retry.js`: shows how to configure retries on errors.

### Basic example

```javascript
var SplunkLogger = require("splunk-logging").Logger;

var config = {
    token: "your-token-here",
    url: "https://splunk.local:8088"
};

var Logger = new SplunkLogger(config);

var payload = {
    // Message can be anything, doesn't have to be an object
    message: {
        temperature: "70F",
        chickenCount: 500
    }
};

console.log("Sending payload", payload);
Logger.send(payload, function(err, resp, body) {
    // If successful, body will be { text: 'Success', code: 0 }
    console.log("Response from Splunk", body);
});
```

## Community

Stay connected with other developers building on Splunk.

<table>

<tr>
<td><b>Email</b></td>
<td>devinfo@splunk.com</td>
</tr>

<tr>
<td><b>Issues</b>
<td><span>https://github.com/splunk/splunk-logging-javascript/issues/</span></td>
</tr>

<tr>
<td><b>Answers</b>
<td><span>http://answers.splunk.com/</span></td>
</tr>

<tr>
<td><b>Blog</b>
<td><span>http://blogs.splunk.com/dev/</span></td>
</tr>

<tr>
<td><b>Twitter</b>
<td>@splunkdev</td>
</tr>

</table>

### Contact us

You can reach the Developer Platform team at _devinfo@splunk.com_.

## License

The Splunk Logging Library for JavaScript is licensed under the Apache
License 2.0. Details can be found in the LICENSE file.
