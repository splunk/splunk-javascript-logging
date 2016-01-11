# Splunk logging for JavaScript

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
