# Splunk logging for JavaScript

## v0.11.1

### Minor changes

* remove the console.log statement

## v0.11.0

### New features & APIs

* Replaced client implementation to use `needle` in lieu of deprecated `request`
* Replaced client implementation to use `nyc` in lieu of deprecated `istanbul`

### Minor changes

* Converted CI from Travis to Github Actions and added CD
* Upgrade version of jsdoc to 3.6.7.
* Upgrade version of jshint to 2.12.0.
* Upgrade version of mocha to 8.4.0.

## v0.10.1

### Minor changes

* Update useragent to match library version.

## v0.10.0

### Breaking changes

* Dropped support for Node.js versions older than 4.0.0.

### Minor changes

* Upgrade version of request to 2.88.0.

## v0.9.3

### Minor changes

* Relax request dependency version, allows new installs to include security updates.

## v0.9.2

### Bug Fixes

* Workaround a urlencoding bug in the request library (GitHub issue [#6](https://github.com/splunk/splunk-javascript-logging/issues/6)).
* Catch JSON parsing errors from the server without crashing (GitHub issue [#9](https://github.com/splunk/splunk-javascript-logging/issues/9)).

## v0.9.1

### Bug Fixes

* Relax port validation for ports < 1000.

## v0.9.0

### New features & APIs

* Added the ability to configure automated batching with 3 settings: `batchInterval`, `maxBatchCount`, & `maxBatchSize`.
* Added the ability to retry sending to Splunk Enterprise or Splunk Cloud in the case of network errors with the `maxRetries` configuration setting.
* Added the ability to configure a custom Splunk Enterprise or Splunk Cloud event format by overriding `eventFormatter(message, severity)`.

### Breaking Changes

* Removed the `autoFlush` configuration setting. To achieve the same effect, set `config.maxBatchCount` to `0`.
* Removed support for middleware functions.
* The `context` object has been simplified, `config` and `requestOptions` can no longer be specified there; please use those settings directly on the logger.

### Examples

* Removed the `middleware.js` example.
* Renamed the `batching.js` example to `manual_batching`.
* Added the `all_batching.js`, `custom_format.js`, `retry.js` examples.

### Minor changes

* Significant refactor of internal functions.

## v0.8.0 - beta

* Beta release.
