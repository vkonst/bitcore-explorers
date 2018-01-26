'use strict';

var should = require('chai').should();

var explorers = require('../../');
var TxMsg = explorers.models.TxMsg;

describe('TxMsg', function() {

    describe('instantiation', function() {

        var data = require('./sampleTxMsgsFromInsight.json');
        var txMsg;

        beforeEach(function(){
            txMsg = TxMsg.fromInsight(data.non_coinbase_tx);
        });

        it('works with both strings and objects', function() {
            TxMsg.fromInsight(JSON.stringify(data.non_coinbase_tx))
                .should.deep.equal(txMsg);
        });

        it('parses correctly a sample tx msg from Insight', function() {
            txMsg.txid.should.equal('afd071e16184ae983656338e0ed90c340ba7940ccdfb1613d2ae0a49f07cb167');
            txMsg.valueOut.should.equal(1.0994392);
            txMsg.vout.should.deep.equal([
                { "muNLJGrzhPfVp84j1w3NayxDH49tWSBDbP": 100000000 },
                { "mx6swcM5ggkuoxTpSLMmNGkjhp32vpvMBR": 9943920 }
            ]);
            txMsg.isRBF.should.equal(false);
        });

        it('parses correctly a sample coinbase tx msg from Insight', function() {
            txMsg = TxMsg.fromInsight(data.conibase_tx);
            txMsg.txid.should.equal('b2e3187102fdb22469c1f726ac3f44c569bd70da056a452bfec6d360bcebb96d');
            txMsg.valueOut.should.equal(25);
            txMsg.vout.should.deep.equal([]);
            txMsg.isRBF.should.equal(false);
        });

        it('returns the same instance if an TxMsg is provided', function() {
            (new TxMsg(txMsg)).should.equal(txMsg);
        });

        it('can be instantiated without new', function() {
            (TxMsg(txMsg)).should.equal(txMsg);
        });

    });

});
