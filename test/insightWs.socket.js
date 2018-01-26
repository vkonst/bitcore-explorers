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

        describe('InsightWs socket', function () {
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
