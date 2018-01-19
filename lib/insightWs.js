'use strict';

var bitcore = require('bitcore-lib');
var debug = require('debug');
var EventEmitter = require('events').EventEmitter;
var io = require('socket.io-client');
var Insight = require('./insight');
var inherits = require('./utils').inherits;


var Networks = bitcore.Networks;
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

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
    const INSIGHT_API_PREFIX = '/insight-api/'; // HTTP API work on http://[server_url]/insight-api/
    var url = serverUrl ?
        serverUrl.replace(/\/$/, "") + INSIGHT_API_PREFIX : undefined;
    Insight.apply(insightWs, [url, network]);
    if (serverUrl) {
        JSUtil.defineImmutable(insightWs, {
            wsUrl: serverUrl
        })
    } else {
        JSUtil.defineImmutable(insightWs, {
            wsUrl: (insightWs.network === Networks.livenet) ?
                'https://insight.bitpay.com' : 'https://test-insight.bitpay.com'
        })
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
    // insightWs.events.emit('insightWs:newBlockHash', blockHash);
    insightWs.getBlock(blockHash, function(err, block) {
        if (err) {
            insightWs.events.emit('insightWs:error', err);
        } else {
            insightWs.events.emit('insightWs:newBlockHash', block);
        }
    });
};

// FIXME: Replace this DRAFT code
// FIXME: Consider using models/addressinfo to validate/decode addresses
/**
 * Process 'new transaction' message from the Insight-API server.
 * @param {obj} tx 'New tx' message data
 * @private
 */
InsightWs.prototype._onNewTx = function (tx) {
    /* FIXME: delete tx example
      {
        "txid":"9e30be99b367fd4752cd11cf3ced6ed1ba37edbe4e035b514ed840b01433dd7d",
        "valueOut":49.8999548,
        "vout":[
            {"muJuXsGBPyRENZXUeazqXbwuzjWJwfkxKd":3489995480},
            {"muFKM26VHKbTRDnujw4bVi2dMyxDKT2LiA":1500000000}
         ],
         "isRBF":false
      }
    */
    var insightWs = this;
    insightWs.events.emit('insightWs:newTx', tx);
    tx.vout.forEach(function (each_vout) {
        debug({address: Object.keys(each_vout)[0], amount: each_vout[Object.keys(each_vout)[0]]});
        insightWs.events.emit(Object.keys(each_vout)[0], {
            address: Object.keys(each_vout)[0],
            amount: each_vout[Object.keys(each_vout)[0]]
        });
    });
    // debug("New transaction: " + JSON.stringify(data));
};

/**
 * @callback InsightWs.BlockCallback
 * @param {Error} err
 * @param {Block} info
 */

/**
 * Retrieve information about a block
 * @param {string} blockHash
 * @param {BlockCallback} callback
 */
Insight.prototype.getBlock = function(blockHash, callback) {
    $.checkArgument(_.isFunction(callback));
    this.requestGet('block/' + blockHash, function(err, res, body) {
        if (err || res.statusCode !== 200) {
            callback(err || body);
        }
        var block;
        try {
            block = body;
        } catch (e) {
            if (e instanceof SyntaxError) {
                return callback(e);
            }
            throw e;
        }
        callback(null, block);
    });
};

module.exports = InsightWs;
