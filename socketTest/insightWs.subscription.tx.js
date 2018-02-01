/* global describe, it, beforeEach, afterEach, setImmediate*/

'use strict';

require('chai').should();
var sinon = require('sinon');
var expect = require('chai').expect;
var explorers = require('../index');
var io = require('socket.io');

var InsightWs = explorers.InsightWs;


describe('InsightWs \'tx\' subscription', function() {
    var insightWs, ioServer;
    var serverUrl = 'http://localhost:3002';
    var sampleTxMsgsFromInsight = require('../test/models/sampleTxMsgsFromInsight');
    var sampleTxFromInsight = require('../test/models/sampleTxsFromInsight');

    beforeEach(function(done) {
        reInitIoServer(done);
    });

    beforeEach(function() {
        insightWs = new InsightWs(serverUrl);
        insightWs.requestGet = sinon.stub();
        insightWs.requestGet.onFirstCall().callsArgWith(1, null, {statusCode: 200},
            JSON.stringify(sampleTxFromInsight));
    });

    afterEach(function(done) {
        if (insightWs.socket.connected) { insightWs.socket.disconnect(); }
        done();
    });

    describe('with {"tx": false} set', function () {

        beforeEach(function(done) {
            subscribe({tx: false}, done);
        });

        it('neither listens to \'tx\' events from Insight-API nor re-emits them', function(done) {
            insightWs.events.on('tx', function() {
                done(new Error('unexpected \'tx\' event'));
            });
            insightWs.socket.on('tx', function() {
                var onlyThisOne = 1;
                expect(insightWs.socket.listeners('tx').length).to.equal(onlyThisOne);
                setImmediate(function(){ done(); });
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
        });

        it('neither requests tx info from Insight-API nor emits \'tx:details\' event', function(done) {
            insightWs.events.on('tx:details', function() {
                done(new Error('unexpected \'tx:details\' event'));
            });
            setImmediate(function() {
                expect(insightWs.requestGet.notCalled);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
        });

    });

    describe('with {"tx": true} set', function() {

        beforeEach(function(done) {
            subscribe({tx: true}, done);
        });

        it('listens to \'tx\' events from Insight-API and re-emits them (coinbase_tx)', function(done) {
            insightWs.events.on('tx', function(newTxMsg) {
                newTxMsg.txid.should.equal(sampleTxMsgsFromInsight.coinbase_tx.txid);
                newTxMsg.isRBF.should.equal(sampleTxMsgsFromInsight.coinbase_tx.isRBF);
                newTxMsg.valueOut.should.equal(sampleTxMsgsFromInsight.coinbase_tx.valueOut);
                newTxMsg.vout.should.deep.equal(sampleTxMsgsFromInsight.coinbase_tx.vout);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
        });

        it('listens to \'tx\' events from Insight-API and re-emits them (non_coinbase_tx)', function(done) {
            insightWs.events.on('tx', function(newTxMsg) {
                newTxMsg.txid.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.txid);
                newTxMsg.isRBF.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.isRBF);
                newTxMsg.valueOut.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.valueOut);
                newTxMsg.vout.should.deep.equal(sampleTxMsgsFromInsight.non_coinbase_tx.vout);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.non_coinbase_tx);
        });

        it('neither requests tx info from Insight-API nor emits \'tx:details\' event', function(done) {
            insightWs.events.on('tx:details', function() {
                done(new Error('unexpected \'tx:details\' event'));
            });
            setImmediate(function() {
                expect(insightWs.requestGet.notCalled);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
        });
    });

    describe('with {tx: "detailed"} set', function() {

        beforeEach(function(done) {
            subscribe({tx: 'detailed'}, done);
        });

        it('listens to \'tx\' events from Insight-API and re-emits them', function(done) {
            insightWs.events.on('tx', function(newTxMsg) {
                newTxMsg.txid.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.txid);
                newTxMsg.isRBF.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.isRBF);
                newTxMsg.valueOut.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.valueOut);
                newTxMsg.vout.should.deep.equal(sampleTxMsgsFromInsight.non_coinbase_tx.vout);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.non_coinbase_tx);
        });

        it('requests block info from Insight-API and emits \'tx:details\' event', function(done) {
            insightWs.events.on('tx:details', function(newTx) {
                newTx.should.deep.equal(sampleTxFromInsight);
                done();
            });
            emitInsightApiEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
        });
    });

/* jshint -W003 */
    function reInitIoServer(done) {
        if (ioServer) {
            ioServer.close(function () {
                ioServer = io.listen(3002);
                done();
            });
        } else {
            ioServer = io.listen(3002);
            done();
        }
    }

    function subscribe(subscription, done) {
        insightWs.subscribe(subscription);
        insightWs.socket.on('connect', function() { done(); });
    }
    function emitInsightApiEvent(event, info) {
        ioServer.emit(event, info);
    }
});
