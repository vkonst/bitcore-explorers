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
    var wsUrl;
    var prefix = routePrefix ? routePrefix : 'insight-api/';
    var url = serverUrl ?
        serverUrl.replace(/\/$/,"") + '/' + routePrefix.replace(/^\//,"") : undefined;
    var insightWs = Insight(url, network);
    if (serverUrl) {
        wsUrl = serverUrl;
    } else {
        wsUrl = (insightWs.network === Networks.livenet) ?
            'https://insight.bitpay.com' : 'https://test-insight.bitpay.com';
        }
    }
    JSUtil.defineImmutable(insightWs, {
        wsUrl: wsUrl,
        events: new EventEmitter()
    });
    return insightWs;
}

// FIXME: add JSDoc definitions
InsightWs.prototype.connect = function(subscribeOpts) {
    var RECONNECT_MILLIS = 5000;
    var insightWs = this;
    JSUtil.defineImmutable(insightWs, {
        subscriptions: subscribeOpts ? subscribeOpts : {newBlock: true, tx: false}
    });

    return new Promise(function(resolve, reject) {
        if (!insightWs.isConnected) {
            connectSocket();
        }

        insightWs.socket.on('connect', function() {
            insightWs.isConnected = true;
            // FIXME: consider if 'resolve' and/or 'emit' to be called with process.nexttick/setimmediate
            resolve();
            insightWs.socket.emit('subscribe', 'inv');
            // FIXME: check if 'on.connect' gets input param(s) worth of emitting
            insightWs.events.emit('insightWs:connected');
        });

        // FIXME: consider if disconnect needs processing and following DRAFT code needed
        insightWs.socket.on('disconnect', function(d) {
            insightWs.events.emit('insightWs:disconnected');
            debug('Websocket disconnected!', d);
            connectSocket();
        });

        insightWs.socket.on('error', function(e) {
            // FIXME: add error processing
            debug('error!', e);
            insightWs.events.emit('insightWs:error', e);
        });

        // FIXME: check events name
        // FIXME: consider if subscriptions to be moved into 'on.connect'
        if (insightWs.subscriptions.tx) {
            // FIXME: use InsightWs._onNewTx (with correct binding)
            insightWs.socket.on('tx', onNewTx);
        }
        if (insightWs.subscriptions.newBlock) {
            // FIXME: use InsightWs._onNewBlock (with correct binding)
            insightWs.socket.on('block', onNewBlock);
        }

    };

    function connectSocket() {
        insightWs.socket = io(insightWs.wsUrl);
    }

    function disconnectSocket() {
        insightWs.socket.disconnect();
    }

    function reconnectSocket() {
        // FIXME: implement reconnect logic if needed
        setTimeout(function() {
            if (!insightWs.isConnected === false) {
                debug('Webscoket reconnecting...');
            }
        }, RECONNECT_MILLIS);
    }

};

InsightWs.prototype._onNewBlock = function() {
// FIXME: Write processing of 'newBlock' event
// FIXME: Implement insightWs.events.emit('insightWs:newBlock', ...);
};

// FIXME: Replace this DRAFT code
// FIXME: Consider using models/addressinfo to validate/decode addresses
InsightWs.prototype._onNewTx = function(data) {
    var insightWs = this;
    insightWs.events.emit('insightWs:rawtx', data);
    data.vout.forEach(function(each_vout) {
        debug({ address: Object.keys(each_vout)[0], amount: each_vout[Object.keys(each_vout)[0]] });
        insightWs.events.emit(Object.keys(each_vout)[0], { address: Object.keys(each_vout)[0], amount: each_vout[Object.keys(each_vout)[0]] });
    });
    debug("New transaction: " + JSON.stringify(data));
};

module.exports = InsightWs;
