'use strict';

var sinon = require('sinon');
var should = require('chai').should();
var bitcore = require('bitcore-lib');
var io = require('socket.io');
var explorers = require('../');

var InsightWs = explorers.InsightWs;


describe('InsightWs socket tx events', function() {
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

    it('can get \'tx\' msg from web socket', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.deep.equal(sampleTxMsgsFromInsight.non_coinbase_tx.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.non_coinbase_tx);
    });

    it('can get new \'tx\' msg from web socket on coinbase tx', function (done) {
        insightWs.events.on('tx', function (txMsg) {
            txMsg.txid.should.deep.equal(sampleTxMsgsFromInsight.conibase_tx.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.conibase_tx);
    });

    it('can get new tx details from HTTP API', function (done) {
        insightWs.events.on('tx:details', function (txData) {
            txData.txid.should.deep.equal(sampleTxMsgsFromInsight.tx_detailed_event.txid);
            done();
        });
        emitEvent('tx', sampleTxMsgsFromInsight.tx_detailed_event);
    });

    function emitEvent(event, info) { ioServer.emit(event, info); }
}); // describe