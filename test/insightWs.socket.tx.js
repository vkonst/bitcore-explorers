/* global describe, it, before, beforeEach, afterEach */

'use strict';

require('chai').should();
var sinon = require('sinon');
var expect = require('chai').expect;
var explorers = require('../');
var io = require('socket.io');

var InsightWs = explorers.InsightWs;


describe('InsightWs socket tx events', function() {
    var insightWs, ioServer;
    var serverUrl = 'http://localhost:3002';

    var sampleTxMsgsFromInsight = require('./models/sampleTxMsgsFromInsight');
    var sampleTxFromInsight = require('./models/sampleTxsFromInsight');

    before(function(done) {
        ioServer = io.listen(3002);
        done();
    });

    beforeEach(function(done) {
        insightWs = new InsightWs(serverUrl);
        insightWs.requestGet = sinon.stub();
        insightWs.requestGet.onFirstCall().callsArgWith(1, null, {statusCode: 200},
            JSON.stringify(sampleTxFromInsight));
        var subscriptions = {block: false, tx : 'detailed'};
        insightWs.subscribe(subscriptions);
        insightWs.socket.on('connect', function() {
            done();
        });
    });

    afterEach(function (done) {
       if (insightWs.socket.connected) {
           insightWs.socket.disconnect();
       }
       done();
    });

    it('can get new tx from web socket  (non_coinbase_tx)', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.txid);
            txMsg.valueOut.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.valueOut);
            txMsg.isRBF.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.isRBF);
            expect(txMsg.vout).to.deep.equal(sampleTxMsgsFromInsight.non_coinbase_tx.vout);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.non_coinbase_tx);
    });

    it('can get new tx from web socket  (coinbase_tx)', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.equal(sampleTxMsgsFromInsight.coinbase_tx.txid);
            txMsg.valueOut.should.equal(sampleTxMsgsFromInsight.coinbase_tx.valueOut);
            txMsg.isRBF.should.equal(sampleTxMsgsFromInsight.coinbase_tx.isRBF);
            expect(txMsg.vout).to.deep.equal(sampleTxMsgsFromInsight.coinbase_tx.vout);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
    });

    it('can get new tx details from HTTP API', function (done) {
        insightWs.events.on('tx:details', function (txData) {
            expect(txData).to.deep.equal(sampleTxFromInsight);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.coinbase_tx);
    });

    function emitEvent(event, info) { ioServer.emit(event, info); } // jshint ignore: line
});