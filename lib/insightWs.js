'use strict';

var bitcore = require('bitcore-lib');
var debug = require('debug');
var EventEmitter = require('events').EventEmitter;
var io = require('socket.io-client');
var Insight = require('./insight');
var inherits = require('./utils').inherits;
// var AddressInfo = require('./models/addressinfo');


var Networks = bitcore.Networks;
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;
var Address = bitcore.Address;

/**
 * Extends the Insight "class" with new methods to subscribe to (and to emmit events on)
 * notifications on new txs and blocks which the Insight server sends via websockets.
 * @param {string=} serverUrl The url of the Insight server w/o the routePrefix
 * @param {Network=} network Network to use: livenet or testnet
 * @param {string=} routePrefix The routePrefix (default: 'insight-api/')
 * @constructor
 */
function InsightWs(serverUrl, network, routePrefix) {
    var insightWs = this;
    var endingSlash = /\/$/;
    var openingSlash = /^\//;

    var prefix = routePrefix ?
        routePrefix.replace(openingSlash, "").replace(endingSlash, "") : 'insight-api';
    var url = serverUrl ?
        serverUrl.replace(endingSlash, "") + '/' + prefix : undefined;
    Insight.apply(insightWs, [url, network]);
    if (serverUrl) {
        JSUtil.defineImmutable(insightWs, {
            wsUrl: serverUrl
        });
    } else {
        JSUtil.defineImmutable(insightWs, {
            wsUrl: (insightWs.network === Networks.livenet) ?
                'https://insight.bitpay.com' : 'https://test-insight.bitpay.com'
        });
    }

    JSUtil.defineImmutable(insightWs, {
        events: new EventEmitter()
    });
}
inherits(InsightWs, Insight);


/**
 * Connect to Insight-API server over WebSocket
 * @param {{block: Boolean, tx: Boolean}=} subscribeOpts Subscription options (default: {block: true, tx: false})
 */
InsightWs.prototype.connect = function (subscribeOpts) {
    var insightWs = this;

    if (!insightWs.socket) {
        JSUtil.defineImmutable(insightWs, {
            subscriptions: subscribeOpts ? subscribeOpts : {block: true, tx: false},
            socket: io(insightWs.wsUrl)
        });

        insightWs.socket.on('connect', function () {
            insightWs.socket.emit('subscribe', 'inv');
            insightWs.events.emit('insightWs:connected');
        });

        insightWs.socket.on('disconnect', function(d) {
            insightWs.events.emit('insightWs:disconnected');
            debug('socket disconnected!', d);
        });

        insightWs.socket.on('error', function(e) {
            debug('socket error!', e);
            insightWs.events.emit('insightWs:error', e);
        });

        if (insightWs.subscriptions.tx) {
            insightWs.socket.on('tx', function(newTx) {
                debug('New transaction: ', newTx);
                insightWs._onNewTx(newTx);
            });
        }
        if (insightWs.subscriptions.block) {
            insightWs.socket.on('block', function(blockHash) {
                insightWs._onNewBlock(blockHash);
                debug('New block: ', blockHash)
            });
        }
    } else {
        throw new Error('Socket already connected');
    }
};

/**
 * Process 'new block' message from the Insight-API server.
 * @param {string} blockHash Block hash
 * @private
 */
InsightWs.prototype._onNewBlock = function (blockHash) {
    var insightWs = this;
    debug("New block: " + blockHash);
    insightWs.events.emit('insightWs:newBlockHash', blockHash);
    insightWs.getBlock(blockHash, function(err, block) {
        if (err) {
            insightWs.events.emit('insightWs:error', err);
        } else {
            if (blockHash === block.hash) {
                insightWs.events.emit('insightWs:newBlock', block);
            } else {
                insightWs.events.emit('insightWs:error', new Error("Invalid block hash received from the node"));
            }
        }
    });
};


// FIXME: Consider using models/addressinfo to validate/decode addresses
/**
 * Process 'new transaction' message from the Insight-API server.
 * @param {obj} tx 'New tx' message data
 * @private
 */
InsightWs.prototype._onNewTx = function (tx) {
    var insightWs = this;
    var txHash = tx.txid;

    insightWs.getTx(txHash, function (err, tx) {
        if (err) {
            insightWs.events.emit('insightWs:error', err);
        } else {
            insightWs.events.emit('insightWs:newTx', tx);
            var amounts = [];
            tx.vout.forEach(function (eachVout, voutIndex, _vout) {
                debug("Address: ", eachVout.scriptPubKey, "\nAmount: ", eachVout.value);
                eachVout.scriptPubKey.addresses.forEach(function (each_vout_address) {
                    if (Address.isValid(each_vout_address)) {
                        var voutEventArrayElem = {};

                        voutEventArrayElem[each_vout_address] = eachVout.value;
                        amounts.push(voutEventArrayElem);

                        insightWs.events.emit(each_vout_address, {
                            amount: eachVout.value
                        });
                    } else {
                        insightWs.events.emit('insightWs:error', new Error(each_vout_address + " address is invalid"));
                    }
                });
                if (voutIndex === _vout.length - 1) {
                    insightWs.events.emit('insightWs:vout', amounts);
                }
            });
        }
    });
};

/**
 * @callback InsightWs.BlockCallback
 * @param {Error} err
 * @param {Block} block
 */

/**
 * Retrieve information about a block
 * @param {string} blockHash
 * @param {BlockCallback} callback
 */
InsightWs.prototype.getBlock = function(blockHash, callback) {
    $.checkArgument(_.isFunction(callback));
    this.requestGet('block/' + blockHash, function(err, res, body) {
        if (err || res.statusCode !== 200) {
            callback(err || body);
        }
        var block;
        try {
            block = JSON.parse(body);
        } catch (e) {
            if (e instanceof SyntaxError) {
                return callback(e);
            }
        }
        callback(null, block);
    });
};

/**
 * @callback InsightWs.TxCallback
 * @param {Error} err
 * @param {Transaction} tx
 */

/**
 * Retrieve information about a transaction
 * @param {string} transactionHash
 * @param {TxCallback} callback
 */
InsightWs.prototype.getTx = function (transactionHash, callback) {
    $.checkArgument(_.isFunction(callback));
    this.requestGet('tx/' + transactionHash, function (err, res, body) {
        if (err || res.statusCode !== 200) {
            callback(err || body);
        }
        var tx;
        try {
            tx = JSON.parse(body);
        } catch (e) {
            if (e instanceof SyntaxError) {
                return callback(e);
            }
        }
        callback(null, tx);
    });
};

module.exports = InsightWs;
