'use strict';

var bitcore = require('bitcore-lib');
var debug = require('debug');
var EventEmitter = require('events').EventEmitter;
var io = require('socket.io-client');
var Insight = require('./insight');


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
    // var wsUrl;
    var prefix = routePrefix ? routePrefix : 'insight-api/';
    var url = serverUrl ?
        serverUrl.replace(/\/$/, "") + '/' + prefix.replace(/^\//, "") : undefined;
    // var insightWs = new Insight(url, network);
    var insight = new Insight(url, network);
    if (serverUrl) {
        insightWs.wsUrl = serverUrl;
    } else {
        insightWs.wsUrl = (insight.network === Networks.livenet) ?
            'https://insight.bitpay.com' : 'https://test-insight.bitpay.com';
    }

    JSUtil.defineImmutable(InsightWs, {
        wsUrl: insightWs.wsUrl
    });

    return this;
}

InsightWs.prototype = Object.create(Insight.prototype);
InsightWs.prototype.constructor = InsightWs;

InsightWs.prototype.events = new EventEmitter();


/**
 * New InsightWs method for connect to socket-api in insight-ui.
 * Connection to socket init with first call of this method, socket.io-client use insightWs.wsUrl
 * param like the socket server.
 * @param {{newBlock: Boolean, tx: Boolean}=} option which declare what events must emit the
 *                                            InsightWs EventEmitter default is
 *                                            {newBlock: false, tx: true}
 * @returns {Promise<any>}
 */

InsightWs.prototype.connect = function (subscribeOpts) {
    var RECONNECT_MILLIS = 5000;
    var insightWs = this;
    JSUtil.defineImmutable(insightWs, {
        subscriptions: subscribeOpts ? subscribeOpts : {newBlock: false, tx: true}
    });

    return new Promise(function (resolve, reject) {
        if (!insightWs.socket) {
            connectSocket();
        }

        insightWs.socket.on('connect', function () {
            // FIXME: consider if 'resolve' and/or 'emit' to be called with process.nexttick/setimmediate
            // The resolve method need for returning some data on fulfilled promise callback
            // There is not have some data which must be returned on fulfilled action
            insightWs.socket.emit('subscribe', 'inv');
            insightWs.events.emit('insightWs:connected');
        });

        // FIXME: consider if disconnect needs processing and following DRAFT code needed
        insightWs.socket.on('disconnect', function(d) {
            insightWs.events.emit('insightWs:disconnected');
            debug('Websocket disconnected!', d);
            // connectSocket();
            // disconnectSocket();
        });

        insightWs.socket.on('error', function(e) {
            // FIXME: add error processing
            debug('error!', e);
            insightWs.events.emit('insightWs:error', e);
        });

        // FIXME: check events name
        // FIXME: consider if subscriptions to be moved into 'on.connect'
        if (insightWs.subscriptions.tx) {
            insightWs.socket.on('tx', function(newTx) {
                debug('New transaction: ', newTx);
                insightWs._onNewTx(newTx); // call _onNewTx method with new transaction response
            });
        }
        if (insightWs.subscriptions.newBlock) {
            // FIXME: use InsightWs._onNewBlock (with correct binding)
            insightWs.socket.on('block', function(newBlock) {
                insightWs._onNewBlock(newBlock); // just start work with this FIXME
                debug('New block: ', newBlock)
            });
        }
    });

    function connectSocket() {
        JSUtil.defineImmutable(insightWs, {
            socket: io(InsightWs.wsUrl),
        });
    }

    function disconnectSocket() {
        insightWs.socket.disconnect();
    }

    function reconnectSocket() {
        // FIXME: implement reconnect logic if needed
        setTimeout(function () {
            if (!insightWs.socket.connected) {
                debug('Webscoket reconnecting...');
                console.log("reconnect")
            }
        }, RECONNECT_MILLIS);
    }

};


/**
 * Private method for emit new block receive.
 * @param {Bitcore.Block=} response from insight server
 * @private
 */
InsightWs.prototype._onNewBlock = function (data) {
// FIXME: Write processing of 'newBlock' event
// FIXME: Implement insightWs.events.emit('insightWs:newBlock', ...);
    var insightWs = this;
    insightWs.events.emit('insightWs:newBlock', data);
    debug("New block: " + JSON.stringify(data));
};

// FIXME: Replace this DRAFT code
// FIXME: Consider using models/addressinfo to validate/decode addresses
/**
 * Private method for emit new transaction receive.
 * @param {Bitcore.Transaction=} response from insight server
 * @private
 */

InsightWs.prototype._onNewTx = function (data) {
    var insightWs = this;
    insightWs.events.emit('insightWs:newTx', data);
    data.vout.forEach(function (each_vout) {
        debug({address: Object.keys(each_vout)[0], amount: each_vout[Object.keys(each_vout)[0]]});
        insightWs.events.emit(Object.keys(each_vout)[0], {
            address: Object.keys(each_vout)[0],
            amount: each_vout[Object.keys(each_vout)[0]]
        });
    });
    // debug("New transaction: " + JSON.stringify(data));
};

module.exports = InsightWs;
