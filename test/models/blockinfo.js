/* jshint -W101 */
'use strict';

var should = require('chai').should();

var explorers = require('../../');
var BlockInfo = explorers.models.BlockInfo;

describe('BlockInfo', function() {

    describe('instantiation', function() {

        var data = require('./sampleBlockFromInsight.json');
        var blockInfo = BlockInfo.fromInsight(data);


        it('works with both strings and objects', function() {
            BlockInfo.fromInsight(JSON.stringify(data)).should.deep.equal(blockInfo);
        });

        it('parses correctly a sample response from Insight', function() {
            should.exist(blockInfo);
            blockInfo.hash.should.equal('25c997224436e703d069986b0a63837447a137592d17a124e3b1a81117b49c57');
            blockInfo.previousblockhash.should.equal('423aa5b03f5165f8b23d3c3a61cd41672e6f4b46dddad548502bcb47903e3448');
            blockInfo.height.should.equal(145);
            blockInfo.confirmations.should.equal(1);
            blockInfo.time.should.equal(1516720256);
            blockInfo.transactionIds.length.should.equal(3);
        });

        it('returns the same instance if an BlockInfo is provided', function() {
            (new BlockInfo(blockInfo)).should.equal(blockInfo);
        });

        it('can be instantiated without new', function() {
            (BlockInfo(blockInfo)).should.equal(blockInfo);
        });

    });

});
