declare module "insightWs" {
    const insightWs: InsightWs;

    type subscribeOpts = {block: string|boolean, tx: string|boolean};

    class InsightWs {
        constructor (
            serverOrNetwork: string | object, // string or Bitcore-lib Network
            network: object, // Bitcore-lib Network
            routePrefix: string
        );

        public url: string;
        public wsUrl: string;
        public network: object;
        public events: object; // EventEmitter
        public subsctiptions: subscribeOpts;
        public subscribe(subscribeOptions: subscribeOpts): void;

        private _onNewBlock(msg: string): void; // msg is block hash string
        private _onNewTx(msg: object): void; //msg is transaction returned from insight web socket server
        private getBlock(blockHash: string, callback: Function): Function;
    }

    export = insightWs;
}