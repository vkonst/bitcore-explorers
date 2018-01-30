'use strict';

var sinon = require('sinon');
var should = require('chai').should();
var expect = require('chai').expect;
var bitcore = require('bitcore-lib');
var explorers = require('../');
var io = require('socket.io');

var Insight = explorers.Insight;
var InsightWs = explorers.InsightWs;
var Address = bitcore.Address;
var Transaction = bitcore.Transaction;
var AddressInfo = explorers.models.AddressInfo;
var Networks = bitcore.Networks;

describe('InsightWs socket block events', function() {
    var insightWs, ioServer;
    var serverUrl = 'http://localhost:3001';

    var sampleBlockFromInsight = require('./models/sampleBlockFromInsight');

    before(function(done) {
        ioServer = io.listen(3001);
        done();
    });

    beforeEach(function(done) {
        insightWs = new InsightWs(serverUrl);
        insightWs.requestGet = sinon.stub();
        insightWs.requestGet.onFirstCall().callsArgWith(1, null, {statusCode: 200},
            JSON.stringify(sampleBlockFromInsight));
        insightWs.subscribe();
        insightWs.socket.on('connect', function() {
            done();
        });
    });

    afterEach(function (done) {
        if (insightWs.socket.connected) { insightWs.socket.disconnect(); }
        done();
    });

    it('can get new blockHash web socket server', function(done) {
        insightWs.events.on('block', function doTest(newBlockHash) {
            newBlockHash.should.equal(sampleBlockFromInsight.hash);
            done();
        });
        emitEvent('block', sampleBlockFromInsight.hash);
    });
    it('can get new block details from HTTP API', function(done) {
        insightWs.events.on('block:details', function doTest(newBlock) {
            newBlock.hash.should.equal(sampleBlockFromInsight.hash);
            newBlock.previousblockhash.should.equal(sampleBlockFromInsight.previousblockhash);
            newBlock.height.should.equal(sampleBlockFromInsight.height);
            newBlock.confirmations.should.equal(sampleBlockFromInsight.confirmations);
            newBlock.time.should.equal(sampleBlockFromInsight.time);
            newBlock.transactionIds.forEach(function (each_tx, index) {
                each_tx.should.equal(sampleBlockFromInsight.tx[index]);
            });
            done();
        }); // doTest
        emitEvent('block', sampleBlockFromInsight.hash);
    }); // it
    function emitEvent(event, info) { ioServer.emit(event, info); }
}); // describe
