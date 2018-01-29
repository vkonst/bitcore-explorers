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


describe('InsightWs socket', function() {
    var insightWs, ioServer;
    var serverUrl = 'http://localhost:3002';

    var sampleTxMsgsFromInsight = require('./models/sampleTxMsgsFromInsight');
    var sampleTxFromInsight = require('./models/sampleTxFromInsight');

    before(function(done) {
        ioServer = io.listen(3002);
        done();
    }); // before

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
    }); // beforeEach

    afterEach(function (done) {
       if (insightWs.socket.connected) {
           insightWs.socket.disconnect();
       }
       done();
    });

    it('can get new tx from web socket  (non_coinbase_tx)', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.equal(sampleTxMsgsFromInsight.non_coinbase_tx.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.non_coinbase_tx);
    });

    it('can get new tx from web socket  (coinbase_tx)', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.equal(sampleTxMsgsFromInsight.conibase_tx.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.conibase_tx);
    });

    it('can get new tx details from HTTP API', function (done) {
        insightWs.events.on('tx:details', function (txData) {
            txData.txid.should.equal(sampleTxMsgsFromInsight.tx_detailed_event.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.tx_detailed_event);
    });

    function emitEvent(event, info) { ioServer.emit(event, info); }
}); // describe