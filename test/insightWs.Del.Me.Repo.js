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

const subscribeOpts = {newBlock: true, tx: false};

var newInsight = new InsightWs(serverURL, Networks.testnet, serverInsightPrefix);

newInsight.connect(subscribeOpts).then(
    () => {
        // ...
    },
    (err) => {
        console.log("WebSocket connection error: ", err);
});

newInsight.events.on("insightWs:connected", () => {
    console.log("insightWs:connected")
});

newInsight.events.on("insightWs:newBlock", data => {
    console.log(data);
});





