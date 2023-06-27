import { jsonsplitteroptions } from "oberknecht-jsonsplitter/lib-ts/types/jsonsplitter.options";
export type jsonsplitterServerOptions = jsonsplitteroptions & {
    serverWSPort?: number;
    serverWSPassword?: string | undefined;
    serverWSHeartbeatInterval?: number;
    serverWSMaxPendingPings?: number;
};
export declare const defaults: {
    serverWSPort: number;
};
