'use strict';

var bitcore = require('bitcore-lib');

var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

function BlockInfo(param) {
    if (!(this instanceof BlockInfo)) {
        return new BlockInfo(param);
    }
    if (param instanceof BlockInfo) {
        return param;
    }

    $.checkArgument(JSUtil.isHexa(param.hash));
    $.checkArgument(JSUtil.isHexa(param.previousblockhash));
    $.checkArgument(_.isNumber(param.height));
    $.checkArgument(_.isNumber(param.confirmations));
    $.checkArgument(_.isNumber(param.time));
    $.checkArgument(_.isArray(param.transactionIds));
    $.checkArgument(_.all(_.map(param.transactionIds, JSUtil.isHexa)));

    JSUtil.defineImmutable(this, param);
}

BlockInfo.fromInsight = function(param) {
    if (_.isString(param)) {
        param = JSON.parse(param);
    }
    return new BlockInfo({
        hash: param.hash,
        previousblockhash: param.previousblockhash,
        height: param.height,
        confirmations: param.confirmations,
        time: param.time,
        transactionIds: param.tx
    });
};

module.exports = BlockInfo;
