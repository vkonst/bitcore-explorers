'use strict';

var bitcore = require('bitcore-lib');
var debug = require('debug')('insight-ws');
var EventEmitter = require('events').EventEmitter;
var io = require('socket.io-client');
var Insight = require('./insight');
var inherits = require('./utils').inherits;
var BlockInfo = require('./models/blockinfo');
var BlockMsg = require('./models/blockmsg');
var TxMsg = require('./models/txmsg');


var Networks = bitcore.Networks;
var _ = bitcore.deps._;
var $ = bitcore.util.preconditions;
var JSUtil = bitcore.util.js;

/**
 * Extends the Insight "class" with new methods to subscribe to (and to emmit events on)
 * notifications on new txs and blocks which the Insight server sends via websockets.
 * @param {string=} serverOrNetwork The url of the Insight server w/o the routePrefix
 * @param {Network=} network Network to use: livenet or testnet
 * @param {string=} routePrefix The routePrefix (default: 'insight-api/')
 * @constructor
 */
function InsightWs(serverOrNetwork, network, routePrefix) {
    var insightWs = this;
    var endingSlash = /\/$/;
    var openingSlash = /^\//;
    var prefix = routePrefix ?
        routePrefix.replace(openingSlash, "").replace(endingSlash, "") : 'insight-api';
    var server, net, url, wsUrl;

    if (serverOrNetwork && Networks.get(serverOrNetwork)) {
        net = serverOrNetwork;
    } else if (serverOrNetwork) {
        server = serverOrNetwork;
        url = server.replace(endingSlash, "") + '/' + prefix;
        if (network) { net = network; }
    }
    if (!net) { net = Networks.defaultNetwork; }

    Insight.apply(insightWs, url ? [url, net ] : [net]);

    if (server) {
        wsUrl = server.replace(endingSlash, "") + '/';
    } else {
        wsUrl = (insightWs.network === Networks.livenet) ?
            'https://insight.bitpay.com/' : 'https://test-insight.bitpay.com/';
    }

    JSUtil.defineImmutable(insightWs, {
        wsUrl: wsUrl,
        events: new EventEmitter()
    });
}

inherits(InsightWs, Insight);

/**
 * Subscription options.
 * @typedef {block: {(boolean|string)}, tx: {(boolean|string)}} SubscribeOpts
 */

/**
 * Connect to Insight-API server over WebSocket and subscribe to events
 * @param {SubscribeOpts=} subscribeOpts Subscription options (default: {block: 'detailed', tx: false})
 */
InsightWs.prototype.subscribe = function (subscribeOpts) {
    var insightWs = this;

    if (!insightWs.socket) {
        var subscriptions = _.merge({block: 'detailed', tx: false}, subscribeOpts ? subscribeOpts : {});
        JSUtil.defineImmutable(insightWs, {
            subscriptions: subscriptions,
            socket: io(insightWs.wsUrl)
        });

        insightWs.socket.on('connect', function () {
            insightWs.socket.emit('subscribe', 'inv');
            insightWs.events.emit('connected');
        });

        insightWs.socket.on('disconnect', function(d) {
            insightWs.events.emit('disconnected');
            debug('socket disconnected!', d);
        });

        insightWs.socket.on('error', function(e) {
            debug('socket error!', e);
            insightWs.events.emit('error', e);
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
 * @param {string} msg 'block' msg data (sting with block hash)
 * @private
 */
InsightWs.prototype._onNewBlock = function (msg) {
    var insightWs = this;
    var blockHash;
    debug("New block msg: " + msg);

    blockHash = BlockMsg.fromInsight(msg);

    insightWs.events.emit('block', blockHash);
    if (insightWs.subscriptions.block === 'detailed') {
        processDetails();
    }

    function processDetails() {
        insightWs.getBlock(blockHash, function(err, block) {
            if (err) {
                insightWs.events.emit('error', err);
            } else {
                if (blockHash === block.hash) {
                    insightWs.events.emit('block:details', block);
                } else {
                    insightWs.events.emit('error', new Error("Failed to retrieve block data"));
                }
            }
        });
    } 
};


/**
 * Process 'new transaction' message from the Insight-API server.
 * @param {obj} msg 'tx' message data
 * @private
 */
InsightWs.prototype._onNewTx = function (msg) {
    var insightWs = this;
    var txMsg;

    txMsg = TxMsg.fromInsight(msg);
    var txid = txMsg.txid;

    debug("tx", txMsg);
    insightWs.events.emit('tx', txMsg);
    if (insightWs.subscriptions.tx === 'detailed') {
        processDetails();
    }

    function processDetails() {
        insightWs.getTransaction(txid, function (err, txData) {
            if (err) {
                insightWs.events.emit('error', err);
            } else {
                insightWs.events.emit('tx:details', txData);
            }
        });
    }
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
            block = BlockInfo.fromInsight(body);
        } catch (e) {
            if (e instanceof SyntaxError) {
                return callback(e);
            }
        }
        callback(null, block);
    });
};

module.exports = InsightWs;
