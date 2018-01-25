'use strict';

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


var isNode =
    typeof global !== "undefined" &&
    {}.toString.call(global) === '[object global]';


if (isNode) {
    setTimeout(function () {
        var serverUrl = 'http://localhost:3001';
        var sampleTxFromInsight = require('./models/sampleTxFromInsight');
        var sampleBlockFromInsight = require('./models/sampleBlockFromInsight');

        var ioServer = require('socket.io').listen(3001);

        ioServer.on('connection', function () {
            ioServer.emit('connect');
            ioServer.emit('tx', sampleTxFromInsight);
            ioServer.emit('block', sampleBlockFromInsight);
        });


        var insightWs;

        insightWs = new InsightWs(serverUrl);
        insightWs.connect({block: true, tx: true});

        var isConnected = false;
        insightWs.events.on('insightWs:connected', function () {
            isConnected = true;
        });

        var isGetTx = false;
        insightWs.events.on('insightWs:newTx', function (newTx) {
            if (sampleTxFromInsight === newTx) {
                isGetTx = true;
            }
        });

        var isGetBlock = false;
        insightWs.events.on('insightWs:newBlock', function (newBlock) {
            if (sampleBlockFromInsight === newBlock) {
                isGetBlock = true;
            }
        });

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
                it('can call connect method without subscriptions', function () {
                    var insightWs = new InsightWs();
                    insightWs.connect();
                    insightWs.subscriptions.tx.should.equal(false);
                    insightWs.subscriptions.block.should.equal(true);
                });
                it('can call connect method with custom subscriptions', function () {
                    var insightWs = new InsightWs();

                    var subscriptions = {block: false, tx: true};
                    insightWs.connect(subscriptions);
                    insightWs.subscriptions.tx.should.equal(true);
                    insightWs.subscriptions.block.should.equal(false);

                    insightWs = new InsightWs();
                    subscriptions.block = true;
                    insightWs.connect(subscriptions);
                    insightWs.subscriptions.tx.should.equal(true);
                    insightWs.subscriptions.block.should.equal(true);

                    insightWs = new InsightWs();
                    subscriptions = {block: false, tx: false};
                    insightWs.connect(subscriptions);
                    insightWs.subscriptions.tx.should.equal(false);
                    insightWs.subscriptions.block.should.equal(false);
                });
            });

            describe('connect to web socket server, listen \'tx\' and \'block\' events', function () {
                it('can connect to web socket server', function () {
                    isConnected.should.equal(true);
                });

                it('can catch new tx event', function () {
                    isGetTx.should.equal(true);
                });

                it('can catch new block event', function () {
                    isGetBlock.should.equal(true);
                });
            });
        });

        run();
    }, 5000);
}
