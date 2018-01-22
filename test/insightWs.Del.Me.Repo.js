'use strict'

var sinon = require('sinon');
var should = require('chai').should();
var expect = require('chai').expect;
var bitcore = require('bitcore-lib');
var explorers = require('../');

var Insight = explorers.Insight;
var InsightWs = explorers.InsightWs;
var Address = bitcore.Address;
var Transaction = bitcore.Transaction;
var AddressInfo = explorers.models.AddressInfo;
var Networks = bitcore.Networks;


const serverURL = 'http://127.0.0.1:8080/';
const serverInsightPrefix = 'insight/';

const subscribeOpts = {block: true, tx: true};

var newInsight = new InsightWs(serverURL, Networks.testnet, serverInsightPrefix);

newInsight.connect(subscribeOpts);

newInsight.events.on('insightWs:connected', function () {
    console.log("insightWs is connected to socket server");
});


// newInsight.events.on('insightWs:newTx', function (newTx) {
//     console.log("New transaction receive: ", newTx);
// });

// newInsight.events.on('insightWs:newBlockHash', function (block) {
//     console.log("New block receive: ", block);
// });

newInsight.events.on('insightWs:vout', function (amount_array) {
    console.log("Amount array: ", amount_array);
});

newInsight.events.on('insightWs:disconnected', function (data) {
    console.log("Websocket disconnected: ", data);
});
