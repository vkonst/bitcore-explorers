/* global describe, it, beforeEach, afterEach, setImmediate */

'use strict';

require('chai').should();
var expect = require('chai').expect;
var sinon = require('sinon');
var explorers = require('../');
var io = require('socket.io');

var InsightWs = explorers.InsightWs;

describe('InsightWs \'block\' subscription', function() {
    var insightWs, ioServer;
    var serverUrl = 'http://localhost:3001';
    var sampleBlockFromInsight = require('./models/sampleBlockFromInsight');

    beforeEach(function(done) {
        ioServer = io.listen(3001);
        done();
    });

    beforeEach(function() {
        insightWs = new InsightWs(serverUrl);
        insightWs.requestGet = sinon.stub();
        insightWs.requestGet.onFirstCall().callsArgWith(1, null, {statusCode: 200},
            JSON.stringify(sampleBlockFromInsight));
    });

    afterEach(function(done) {
        if (insightWs.socket.connected) { insightWs.socket.disconnect(); }
        ioServer.close(done);
    });

    describe('with {"block": false} set', function() {

        beforeEach(function(done) {
            subscribe({block: false}, done);
        });

        it('neigther listens to \'block\' events from Insight-API nor re-emits them', function(done) {
            insightWs.events.on('block', function() {
                done(new Error('unexpected \'block\' event'));
            });
            insightWs.socket.on('block', function() {
                var onlyThisOne = 1;
                expect(insightWs.socket.listeners('block').length).to.equal(onlyThisOne);
                setImmediate(function(){ done(); });
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });

        it('neighet requests block info from Isight-API nor emits \'block:details\' event', function(done) {
            insightWs.events.on('block:details', function() {
                done(new Error('unexpected \'block:details\' event'));
            });
            setImmediate(function() {
                expect(insightWs.requestGet.notCalled);
                done();
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });
    });

    describe('with {"block": true} set', function() {

        beforeEach(function(done) {
            subscribe({block: true}, done);
        });

        it('listens to \'block\' events from Insight-API and re-emits them', function(done) {
            insightWs.events.on('block', function(newBlockHash) {
                newBlockHash.should.equal(sampleBlockFromInsight.hash);
                done();
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });

        it('neighet requests block info from Isight-API nor emits \'block:details\' event', function(done) {
            insightWs.events.on('block:details', function() {
                done(new Error('unexpected \'block:details\' event'));
            });
            setImmediate(function() {
                expect(insightWs.requestGet.notCalled);
                done();
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });
    });

    describe('with {block: "detailed"} set', function() {

        beforeEach(function(done) {
            subscribe({block: 'detailed'}, done);
        });

        it('listens to \'block\' events from Insight-API and re-emits them', function(done) {
            insightWs.events.on('block', function(newBlockHash) {
                newBlockHash.should.equal(sampleBlockFromInsight.hash);
                done();
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });

        it('requests block info from Isight-API and emits \'block:details\' event', function(done) {
            insightWs.events.on('block:details', function(newBlock) {
                newBlock.hash.should.equal(sampleBlockFromInsight.hash);
                newBlock.previousblockhash.should.equal(sampleBlockFromInsight.previousblockhash);
                newBlock.height.should.equal(sampleBlockFromInsight.height);
                newBlock.confirmations.should.equal(sampleBlockFromInsight.confirmations);
                newBlock.time.should.equal(sampleBlockFromInsight.time);
                newBlock.transactionIds.should.deep.equal(sampleBlockFromInsight.tx);
                done();
            });
            emitInsightApiEvent('block', sampleBlockFromInsight.hash);
        });
    });

/* jshint -W003 */
    function subscribe(subscription, done) {
        insightWs.subscribe(subscription);
        insightWs.socket.on('connect', function() { done(); });
    }
    function emitInsightApiEvent(event, info) {
        ioServer.emit(event, info);
    }
});
