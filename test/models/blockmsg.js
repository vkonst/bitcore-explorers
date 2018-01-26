'use strict';

var should = require('chai').should();

var explorers = require('../../');
var BlockMsg = explorers.models.BlockMsg;

describe('BlockMsg', function() {

    describe('fromInsight() method', function() {

        var msg = '0000000000000000002ea7492005955a17d6f3682ae71c81403400ed4a1117f6';
        var blockHash = msg;

        it('returns same hex string as the input', function() {
            (function() { BlockMsg.fromInsight(msg); }).should.not.throw();
            BlockMsg.fromInsight(msg).should.equal(blockHash);
        });

        it('throws error if the input is invalid hex string', function() {
            var invalidMsg = 'k' + msg + 'k';
            (function() { BlockMsg.fromInsight(invalidMsg); }).should.throw();
        });

    });

});
