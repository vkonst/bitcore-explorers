/* global describe, it */

'use strict';

var should = require('chai').should();
var bitcore = require('bitcore-lib');
var explorers = require('../');

var InsightWs = explorers.InsightWs;
var Networks = bitcore.Networks;

describe('InsightWs', function () {
    describe('instantiation', function () {
        it('can be created without any parameters', function() {
            var insightWs = new InsightWs();
            should.exist(insightWs.url);
            should.exist(insightWs.network);
            if (insightWs.network === Networks.livenet) {
                insightWs.url.should.equal('https://insight.bitpay.com/api/');
                insightWs.wsUrl.should.equal('https://insight.bitpay.com/');
            } else if (insightWs.network === Networks.testnet) {
                insightWs.url.should.equal('https://test-insight.bitpay.com/api/');
                insightWs.wsUrl.should.equal('https://test-insight.bitpay.com/');
            }
        });
        it('can be created providing just a network', function() {
            var insightWs = new InsightWs(Networks.testnet);
            insightWs.url.should.equal('https://test-insight.bitpay.com/api/');
            insightWs.wsUrl.should.equal('https://test-insight.bitpay.com/');
            insightWs.network.should.equal(Networks.testnet);
        });
        it('can be created with a custom serverUrl without network and prefix', function() {
            var serverUrl = 'https://localhost:1234/';
            var urlWithPrefix = serverUrl + 'insight-api/';
            var insightWs = new InsightWs(serverUrl);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(serverUrl);
        });
        it('can be created with a custom serverUrl, default network and custom prefix', function () {
            var serverUrl = 'https://localhost:1234/';
            var network = Networks.defaultNetwork;
            var prefix = 'insight/';
            var urlWithPrefix = serverUrl + prefix;
            var insightWs = new InsightWs(serverUrl, network, prefix);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(serverUrl);
            insightWs.network.should.equal(Networks.defaultNetwork);
        });
        it('can be created with a custom serverUrl that misses ending slash', function() {
            var serverUrl = 'https://localhost:1234';
            var updatedUrl = serverUrl + '/';
            var urlWithPrefix = serverUrl + '/insight-api/';
            var insightWs = new InsightWs(serverUrl, Networks.testnet);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(updatedUrl);
            insightWs.network.should.equal(Networks.testnet);
        });
        it('can be created with a custom serverUrl and network', function() {
            var serverUrl = 'https://localhost:1234/';
            var urlWithPrefix = serverUrl + 'insight-api/';
            var insightWs = new InsightWs(serverUrl, Networks.testnet);
            insightWs.url.should.equal(urlWithPrefix);
            insightWs.wsUrl.should.equal(serverUrl);
            insightWs.network.should.equal(Networks.testnet);
        });
        it('defaults to defaultNetwork on a custom serverUrl', function() {
            var insightWs = new InsightWs('https://localhost:1234/');
            insightWs.network.should.equal(Networks.defaultNetwork);
        });
        it('defaults to \'insight-api/\' prefix on a custom serverUrl', function() {
            var serverUrl = 'https://localhost:1234/';
            var insightWs = new InsightWs(serverUrl);
            var urlWithPrefix = serverUrl + 'insight-api/';
            insightWs.url.should.equal(urlWithPrefix);
        });
    });

    describe('subscriptions', function () {
        it('can call subscribe method without options for subscriptions', function () {
            var insightWs = new InsightWs();
            insightWs.subscribe();
            insightWs.subscriptions.tx.should.equal(false);
            insightWs.subscriptions.block.should.equal('detailed');
        });
        it('can call subscribe method with custom subscriptions options', function () {
            var insightWs = new InsightWs();

            var subscriptions = {block: false, tx: true};
            insightWs.subscribe(subscriptions);
            insightWs.subscriptions.tx.should.equal(true);
            insightWs.subscriptions.block.should.equal(false);

            insightWs = new InsightWs();
            subscriptions= {tx: 'detailed' /*by default, block:'detailed'*/};
            insightWs.subscribe(subscriptions);
            insightWs.subscriptions.tx.should.equal('detailed');
            insightWs.subscriptions.block.should.equal('detailed');

            insightWs = new InsightWs();
            subscriptions = {block: true, tx: true};
            insightWs.subscribe(subscriptions);
            insightWs.subscriptions.tx.should.equal(true);
            insightWs.subscriptions.block.should.equal(true);

            insightWs = new InsightWs();
            subscriptions = {block: false, tx: false};
            insightWs.subscribe(subscriptions);
            insightWs.subscriptions.tx.should.equal(false);
            insightWs.subscriptions.block.should.equal(false);
        });
    });
});
