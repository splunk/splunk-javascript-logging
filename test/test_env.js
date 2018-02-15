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

var assert = require("assert");
var request = require("request");
var fs = require("fs");

/**
 * Load test configuration from test/config.json
 * It just needs a token:
 *
 *     {"token": "token-goes-here"}
 *
 */
var configurationFile = "./config.json";
var token = null;

describe("Environment Tests", function() {
    describe("Splunk on localhost:8089 HEC", function() {
        it("should be enabled", function(done) {
            request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http/http/enable?output_mode=json", {strictSSL: false}, function(err) {
                assert.ok(!err);
                done();
            });
        });
        it("should create a token in test/config.json", function(done) {
            request.post("https://admin:changeme@localhost:8089/servicesNS/admin/splunk_httpinput/data/inputs/http?output_mode=json", {strictSSL: false, body: "name=splunk_logging" + Date.now()}, function(err, resp, body) {
                assert.ok(!err);
                var tokenStart = body.indexOf("\"token\":\"");
                var tokenEnd = tokenStart + 36; // 36 = guid length
                token = body.substring(tokenStart + 9, tokenEnd + 9); // 9 = prefix length of \"token\":\"
                assert.strictEqual(token.length, 36);
                done();
            });
        });
    });
    describe("config.json (test config file)", function() {
        before("should be created from scratch", function() {
            var obj = {token: token};
            fs.writeFileSync(configurationFile, JSON.stringify(obj));
        });
        it("should at least have a token", function() {
            var config = fs.readFileSync(configurationFile);
            var configObj = JSON.parse(config);
            assert.ok(configObj);
            assert.ok(configObj.hasOwnProperty("token"));
            assert.strictEqual(configObj.token.length, 36);
        });
    });
});