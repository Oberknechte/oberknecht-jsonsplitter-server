"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonsplitterClient = void 0;
const ws_1 = require("ws");
const jsonsplitterServer_options_1 = require("../types/jsonsplitterServer.options");
const oberknecht_utils_1 = require("oberknecht-utils");
const oberknecht_emitters_1 = require("oberknecht-emitters");
function onCallback(callback) { }
class jsonsplitterClient {
    wsClient;
    wsClientOptions;
    wsAddress;
    oberknechtEmitter = new oberknecht_emitters_1.oberknechtEmitter();
    #wsMessageNum = 0;
    get wsMessageNum() {
        return this.#wsMessageNum++;
    }
    get isConnected() {
        return this.wsClient.readyState === 1;
    }
    constructor(options) {
        let options_ = options ?? {};
        if (!options_.debug)
            options_.debug = 1;
        this.wsClientOptions = options ?? {};
    }
    on = (type, callback) => {
        return this.oberknechtEmitter.on(type, callback);
    };
    once = (type, callback) => {
        return this.oberknechtEmitter.once(type, callback);
    };
    emit = (eventname, args) => {
        return this.oberknechtEmitter.emit(eventname, args);
    };
    async sendWC(stuff, status, cb) {
        const messageID = `${this.wsMessageNum}`;
        let this_ = this;
        if (this.wsClient.readyState === 0)
            await new Promise((resolve) => {
                function waitTo() {
                    setTimeout(() => {
                        if (this_.wsClient.readyState !== 0)
                            return resolve();
                        waitTo();
                    }, 100);
                }
                waitTo();
            });
        let stuff_ = {};
        if (typeof stuff === "object")
            stuff_ = stuff;
        else
            stuff_.data = stuff;
        stuff_.status = status ?? 200;
        if (stuff?.error || stuff instanceof Error) {
            stuff_.error = (0, oberknecht_utils_1.returnErr)(stuff);
            stuff_.status = status ?? 400;
        }
        stuff_.pass = messageID;
        this.wsClient.send(Buffer.from(JSON.stringify(stuff_)));
        // @ts-ignore
        if (cb)
            return this.once(`ws-message-pass:${messageID}`, cb);
        return new Promise((resolve, reject) => {
            this.once(`ws-message-pass:${messageID}`, (c) => {
                resolve(c);
            });
        });
    }
    sendType = async (type, parameters, stuff, noReject, transportDetails) => {
        return new Promise((resolve, reject) => {
            this.sendWC({
                ...(stuff ?? {}),
                ...(type ? { type: type } : {}),
                ...(parameters ? { parameters: parameters } : {}),
            })
                .then((r) => {
                if (r.error && !noReject)
                    return reject(r.error);
                resolve(transportDetails ? r : r.response);
            })
                .catch(reject);
        });
    };
    sendTypeSync = (type, parameters, stuff, cb) => {
        let cb_ = (args) => {
            if (cb)
                cb(args);
            return args;
        };
        this.sendWC({
            ...(stuff ?? {}),
            ...(type ? { type: type } : {}),
            ...(parameters ? { parameters: parameters } : {}),
        }, undefined, cb_);
    };
    async connectClient() {
        this.wsAddress =
            this.wsClientOptions.serverWSAddress ??
                `ws${this.wsClientOptions.serverWSSecure ? "s" : ""}://127.0.0.1:${this.wsClientOptions.serverWSPort ?? jsonsplitterServer_options_1.defaults.serverWSPort}`;
        let ws = (this.wsClient = new ws_1.WebSocket(this.wsAddress));
        this.wsClient.on("open", () => {
            if (this.wsClientOptions.debug > 1)
                (0, oberknecht_utils_1.log)(1, `WSClient Opened WS Connection to ${this.wsAddress}`);
            this.sendWC({
                type: "login",
                ...(this.wsClientOptions.serverWSPassword
                    ? { password: this.wsClientOptions.serverWSPassword }
                    : {}),
            });
        });
        this.wsClient.on("message", (rawMessage_) => {
            const rawMessage = Buffer.from(rawMessage_.toString()).toString("utf-8");
            if (!oberknecht_utils_1.regex.jsonreg().test(rawMessage))
                return;
            let message;
            try {
                message = JSON.parse(rawMessage);
            }
            catch (e) {
                return;
            }
            if (message.messageID)
                this.emit([`ws-message:${message.messageID}`], message);
            if (message.pass)
                this.emit([`ws-message-pass:${message.pass}`], message);
        });
    }
    createcb = (cb) => {
        return (cb ??
            ((...args) => {
                return args;
            }));
    };
    getKeySync = (keypath, noReject, transportDetails) => {
        return this.sendType("getKeySync", [(0, oberknecht_utils_1.convertToArray)(keypath)], undefined, noReject, transportDetails);
    };
    addKeySync = (keypath, value, noReject, transportDetails) => {
        return this.sendType("addKeySync", [(0, oberknecht_utils_1.convertToArray)(keypath), value], undefined, noReject, transportDetails);
    };
    editKeySync = (keypath, value, noReject, transportDetails) => {
        return this.sendType("editKeySync", [(0, oberknecht_utils_1.convertToArray)(keypath), value], undefined, noReject, transportDetails);
    };
    editKeyAddSync = (keypath, value, noReject, transportDetails) => {
        return this.sendType("editKeyAddSync", [(0, oberknecht_utils_1.convertToArray)(keypath), value], undefined, noReject, transportDetails);
    };
    deleteKeySync = (keypath, noReject, transportDetails) => {
        return this.sendType("deleteKeySync", [(0, oberknecht_utils_1.convertToArray)(keypath)], undefined, noReject, transportDetails);
    };
    recreateAllSync = () => {
        return this.sendType("recreateAllSync");
    };
}
exports.jsonsplitterClient = jsonsplitterClient;
