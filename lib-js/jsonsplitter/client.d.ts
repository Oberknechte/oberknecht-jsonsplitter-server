import { WebSocket } from "ws";
import { jsonsplitterClientOptions } from "../types/jsonsplitterClient.options";
import { oberknechtEmitter } from "oberknecht-emitters";
declare function onCallback(callback: any): void;
export declare class jsonsplitterClient {
    #private;
    wsClient: WebSocket;
    wsClientOptions: jsonsplitterClientOptions;
    wsAddress: string;
    oberknechtEmitter: oberknechtEmitter;
    get wsMessageNum(): number;
    get isConnected(): boolean;
    constructor(options: jsonsplitterClientOptions);
    on: (type: string, callback: typeof onCallback) => void;
    once: (type: string, callback: typeof onCallback) => void;
    emit: (eventname: string | string[], args?: any) => void;
    sendWC(stuff: Record<string, any> | any, status?: number, cb?: Function): Promise<unknown>;
    sendType: (type?: string, parameters?: any, stuff?: Record<string, any>, noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    sendTypeSync: (type?: string, parameters?: any, stuff?: Record<string, any>, cb?: Function) => void;
    connectClient(): Promise<unknown>;
    createcb: (cb: any) => any;
    getKeySync: (keypath: string | string[], noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    addKeySync: (keypath: string | string[], value?: any, noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    editKeySync: (keypath: string | string[], value?: any, noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    editKeyAddSync: (keypath: string | string[], value?: any, noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    deleteKeySync: (keypath: string | string[], noReject?: boolean, transportDetails?: boolean) => Promise<unknown>;
    recreateAllSync: () => Promise<unknown>;
}
export {};
