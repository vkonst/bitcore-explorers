'use strict';

var bitcore = require('bitcore-lib');
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

var BlockMsg = {
    fromInsight: function(blockHash) {
        $.checkArgument(JSUtil.isHexa(blockHash));
        return blockHash;
    }
};

module.exports = BlockMsg;
