'use strict';

var bitcore = require('bitcore-lib');

var Address = bitcore.Address;
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

function TxMsg(param) {
    if (!(this instanceof TxMsg)) {
        return new TxMsg(param);
    }
    if (param instanceof TxMsg) {
        return param;
    }

    $.checkArgument(JSUtil.isHexa(param.txid));
    $.checkArgument(_.isNumber(param.valueOut));
    $.checkArgument(_.isBoolean(param.isRBF));
    $.checkArgument(_.isArray(param.vout));
    if (param.vout.length) {
        $.checkArgument(_.all(_.map(param.vout, function(output) {
            var addresses = Object.keys(output);
            if (addresses.length !== 1) { return false; }
            return Address.isValid(addresses[0])
                && _.isNumber(output[addresses[0]]);
        })));
    }

    JSUtil.defineImmutable(this, param);
}

TxMsg.fromInsight = function(param) {
    if (_.isString(param)) {
        param = JSON.parse(param);
    }
    return new TxMsg({
        txid: param.txid,
        valueOut: param.valueOut,
        isRBF: param.isRBF,
        vout: param.vout
    });
};

module.exports = TxMsg;
