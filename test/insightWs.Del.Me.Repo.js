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

newInsight.connect({newBlock: true, tx: true}).catch(function (err) {
    console.log("Connection error: ", err);
});

newInsight.events.on('insightWs:connected', function (data) {
    console.log("insightWs is connected to socket server", data);
});

newInsight.events.on('insightWs:newTx', function (newTx) {
    console.log("New transaction receive: ", newTx);
});

newInsight.events.on('insightWs:newBlock', function (newBlock) {
    console.log("New block receive: ", newBlock);
});