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

if (typeof process === 'undefined' || process.type === 'renderer') {
    // test for browser
} else {
    // test for nodejs

    describe('InsightWs socket (nodejs only)', function() {
        var insightWs, ioServer;
        var serverUrl = 'http://localhost:3001';

        var sampleTx = require('./models/sampleTxFromInsight');
        var sampleBlock = require('./models/sampleBlockFromInsight');

        before(function(done) {
            ioServer = io.listen(3001);
            done();
        }); // before

        beforeEach(function(done) {
            insightWs = new InsightWs(serverUrl);
            insightWs.requestGet = sinon.stub();
            insightWs.requestGet.onFirstCall().callsArgWith(1, null, {statusCode: 200}, sampleBlock);
            insightWs.subscribe();
            insightWs.socket.on('connect', function() {
                done();
            });
        }); // beforeEach

        it('can get new blockHash from http API', function(done) {
            insightWs.events.on('block', function doTest(newBlockHash) {
                newBlockHash.should.equal(sampleBlock.hash);
                // make assertions
                done();
            }); // doTest
            emitEvent('block', sampleBlock.hash);
        }); // it

        it('can get new block details', function(done) {
            insightWs.events.on('block:details', function doTest(newBlock) {
                newBlock.hash.should.equal(sampleBlock.hash);
                // make assertions
                done();
            }); // doTest
            emitEvent('block', sampleBlock.hash);
        }); // it
        function emitEvent(event, info) { ioServer.emit(event, info); }
    }); // describe

}
