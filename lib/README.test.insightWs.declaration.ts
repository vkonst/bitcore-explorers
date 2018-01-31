import * as InsightWs from './insightWs';

const serverURL = 'http://127.0.0.1:8080'; // web socket server url
const subscriptions = {
    block: true,
    tx: true
};

let insightWs = new InsightWs(serverURL);

insightWs.subscribe(subscriptions);

insightWs.events.on('connected', () => {
    console.log("connected");
});

insightWs.events.on('block', block => {
    console.log("New block: ", block)
});

insightWs.events.on('tx', tx => {
    console.log("New tx: ", tx)
});