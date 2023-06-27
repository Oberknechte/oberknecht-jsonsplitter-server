import { jsonsplitter } from "oberknecht-jsonsplitter";
import { jsonsplitterServerOptions } from "../types/jsonsplitterServer.options";
import { WebSocketServer } from "ws";
export declare class jsonsplitterServer extends jsonsplitter {
    wsServer: WebSocketServer;
    wsServerOptions: jsonsplitterServerOptions;
    constructor(options: jsonsplitterServerOptions);
    connectServer(): Promise<void>;
}
