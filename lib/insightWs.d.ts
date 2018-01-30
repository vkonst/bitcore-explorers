declare class Insight {
    constructor(
        url?: string | object, // string URL or Bitcore-lib Network
        network?: object // FIXME try to declare networks from bitcore-lib
    );

    public url: string;
    public getTransaction(txid: string, callback: insightCallback): insightCallback;
    
    public getUtxos(addresses: Array,  // FIXME try to declare addresses from bitcore-lib
                    callback: insightCallback): insightCallback;
    
    public broadcast(transaction: string | object, // FIXME try to declare transactions from bitcore-lib
                     callback: insightCallback): insightCallback;
    
    public address(address: string | object, // FIXME try to declare addresses from bitcore-lib
                   callback: insightCallback): insightCallback;

    protected network: object; // FIXME try to declare networks from bitcore-lib
    protected requestPost(path: string, data: JSON, callback: Function): void;
    protected requestGet(path: string, callback: Function): void;
}

declare class InsightWs extends Insight {
    constructor (
        serverOrNetwork?: string | object, // string URL or Bitcore-lib Network
        network?: object, // FIXME try to declare networks from bitcore-lib
        routePrefix?: string
    );

    public url: string;
    public wsUrl: string;
    public events: {on: Function};
    public subscribe(subscribeOptions?: subscribeOpts): void;
    public getBlock(blockHash: string, callback: insightCallback): insightCallback;

    protected subsctiptions: subscribeOpts;
    protected network: object; // FIXME try to declare networks from bitcore-lib
    protected _onNewBlock(msg: string): void; // msg is block hash string
    protected _onNewTx(msg: object): void; //msg is transaction returned from insight web socket server
}

type subscribeOpts = {block: string|boolean, tx: string|boolean};
type insightCallback = (error: any, data: any) => void;

export = InsightWs;
