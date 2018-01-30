
type subscribeOpts = {block: string|boolean, tx: string|boolean};

declare class InsightWs {
    constructor (
        serverOrNetwork?: string | object, // string or Bitcore-lib Network
        network?: object, // FIXME try declare networks from bitcore-lib
        routePrefix?: string
    );

    public url: string;
    public wsUrl: string;
    public network: object; // FIXME try declare networks from bitcore-lib
    public events: {on: Function};
    public subsctiptions: subscribeOpts;
    public subscribe(subscribeOptions?: subscribeOpts): void;

    private _onNewBlock(msg: string): void; // msg is block hash string
    private _onNewTx(msg: object): void; //msg is transaction returned from insight web socket server
    private getBlock(blockHash: string, callback: Function): Function;
}

export = InsightWs;
