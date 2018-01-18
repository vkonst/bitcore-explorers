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
    var self = this;
    // var wsUrl;
    var prefix = routePrefix ? routePrefix : 'insight-api/';
    var url = serverUrl ?
        serverUrl.replace(/\/$/, "") + '/' + prefix.replace(/^\//, "") : undefined;
    // var insightWs = new Insight(url, network);
    var insight = new Insight(url, network);
    if (serverUrl) {
        self.wsUrl = serverUrl;
    } else {
        self.wsUrl = (insight.network === Networks.livenet) ?
            'https://insight.bitpay.com' : 'https://test-insight.bitpay.com';
    }

    JSUtil.defineImmutable(InsightWs, {
        wsUrl: self.wsUrl
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
    var self = this;
    JSUtil.defineImmutable(self, {
        subscriptions: subscribeOpts ? subscribeOpts : {newBlock: false, tx: true}
    });

    return new Promise(function (resolve, reject) {
        if (!self.socket) {
            connectSocket();
        }

        self.socket.on('connect', function () {
            // FIXME: consider if 'resolve' and/or 'emit' to be called with process.nexttick/setimmediate
            // The resolve method need for returning some data on fulfilled promise callback
            // There is not have some data which must be returned on fulfilled action
            self.socket.emit('subscribe', 'inv');
            self.events.emit('insightWs:connected');
        });

        // FIXME: consider if disconnect needs processing and following DRAFT code needed
        // disconnect event don't need any processing for start reconnecting,
        // socket.io-client will wait for new connection to server, after connection it's
        // emit 'connect' event
        self.socket.on('disconnect', function(d) {
            self.events.emit('insightWs:disconnected', d);
            debug('Websocket disconnected!', d);
        });

        self.socket.on('error', function(e) {
            // FIXME: add error processing
            debug('error!', e);
            self.events.emit('insightWs:error', e);
        });

        // FIXME: consider if subscriptions to be moved into 'on.connect'
        //
        if (self.subscriptions.tx) {
            self.socket.on('tx', function(newTx) {
                debug('New transaction: ', newTx);
                self._onNewTx(newTx); // call _onNewTx method with new transaction response
            });
        }
        if (self.subscriptions.newBlock) {
            self.socket.on('block', function(newBlock) {
                self._onNewBlock(newBlock);
                debug('New block: ', newBlock)
            });
        }
    });

    function connectSocket() {
        JSUtil.defineImmutable(self, {
            socket: io(InsightWs.wsUrl),
        });
    }

    function disconnectSocket() {
        self.socket.disconnect();
    }

    // function reconnectSocket() {
    //     // FIXME: implement reconnect logic if needed
    //     setTimeout(function () {
    //         if (!insightWs.socket.connected) {
    //             debug('Webscoket reconnecting...');
    //             console.log("reconnect");
    //         }
    //     }, RECONNECT_MILLIS);
    // }

};


/**
 * Private method for emit new block receive.
 * @param {Bitcore.Block=} response from insight server
 * @private
 */
InsightWs.prototype._onNewBlock = function (data) {
// FIXME: Write processing of 'newBlock' event

    // newBlock event don't need processing at that moment, data is just a hex string
    var self = this;
    self.events.emit('insightWs:newBlock', data);
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
    var self = this;
    self.events.emit('insightWs:newTx', data);
    data.vout.forEach(function (each_vout) {
        debug({address: Object.keys(each_vout)[0], amount: each_vout[Object.keys(each_vout)[0]]});
        self.events.emit(Object.keys(each_vout)[0], {
            address: Object.keys(each_vout)[0],
            amount: each_vout[Object.keys(each_vout)[0]]
        });
    });
    // debug("New transaction: " + JSON.stringify(data));
};

module.exports = InsightWs;
