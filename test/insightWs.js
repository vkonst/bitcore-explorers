'use strict'

var sinon = require('sinon');
var should = require('chai').should();
var expect = require('chai').expect;
var bitcore = require('bitcore-lib');
var explorers = require('../');

var Insight = explorers.Insight;
var InsightWs = explorers.InsightWs;
var Address = bitcore.Address;
var Transaction = bitcore.Transaction;
var AddressInfo = explorers.models.AddressInfo;
var Networks = bitcore.Networks;


// const serverURL = 'http://127.0.0.1:8080/';
// const serverInsightPrefix = 'insight-api/';
//
// const subscribeOpts = {block: true, tx: true};
//
// var newInsight = new InsightWs(serverURL, Networks.testnet, serverInsightPrefix);
//
// newInsight.connect(subscribeOpts);
//
// newInsight.events.on('insightWs:connected', function () {
//     console.log("insightWs is connected to socket server");
// });
//
//
// newInsight.events.on('insightWs:newTx', function (newTx) {
//     console.log("New transaction receive: ", newTx);
// });
// newInsight.events.on('insightWs:newBlockHash', function (block) {
//     console.log("New block receive: ", block);
// });
// newInsight.events.on('insightWs:vout', function (amount_array) {
//     console.log("Amount array: ", amount_array);
// });
// newInsight.events.on('some_address', function (someAddressAmounts) {
//     console.log("New someAddress transaction, amount: ", someAddressAmounts);
// });
// newInsight.events.on('insightWs:disconnected', function (data) {
//     console.log("Websocket disconnected: ", data);
// });

describe('InsightWs', function () {
    describe('instantiation', function () {
        it('can be created without any parameters', function() {
            var insightWs = new InsightWs();
            should.exist(insightWs.url);
            should.exist(insightWs.network);
            if (insightWs.network === Networks.livenet) {
                insightWs.url.should.equal('https://insight.bitpay.com/api/');
                insightWs.wsUrl.should.equal('https://insight.bitpay.com');
            } else if (insightWs.network === Networks.testnet) {
                insightWs.url.should.equal('https://test-insight.bitpay.com/api/');
                insightWs.wsUrl.should.equal('https://test-insight.bitpay.com');
            }
        });
        it('can be created providing just a network', function() {
            var insightWs = new InsightWs(Networks.testnet);
            insightWs.url.should.equal('https://test-insight.bitpay.com/api/');
            insightWs.wsUrl.should.equal('https://test-insight.bitpay.com/api/');
            insightWs.network.should.equal(Networks.testnet);
        });
        it('can be created with a custom url without network and prefix', function() {
            var url = 'https://localhost:1234/';
            var urlWithPrefix = url + 'api/';
            var insightWs = new InsightWs(url);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(url);
        });
        it('can be created with a custom url, default network and custom prefix', function () {
            var url = 'https://localhost:1234/';
            var network = Networks.defaultNetwork;
            var prefix = 'insight/';
            var urlWithPrefix = url + prefix;
            var insightWs = new InsightWs(url, network, prefix);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(url);
            insightWs.network.should.equal(Networks.defaultNetwork);
        });
        it('can be created with a custom url that misses ending slash', function() {
            var url = 'https://localhost:1234';
            var updatedUrl = url + '/';
            var insightWs = new InsightWs(url, Networks.testnet);
            insightWs.wsUrl.should.equal(updatedUrl);
            insightWs.network.should.equal(Networks.testnet);
        });
        it('can be created with a custom url and network', function() {
            var url = 'https://localhost:1234';
            var urlWithPrefix = url + '/api/';
            var insightWs = new InsightWs(url, Networks.testnet);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(url + '/');
            insightWs.network.should.equal(Networks.testnet);
        });
        it('defaults to defaultNetwork on a custom url', function() {
            var insightWs = new InsightWs('https://localhost:1234/insight-api/');
            insightWs.network.should.equal(Networks.defaultNetwork);
        });
    });
});
