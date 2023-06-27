"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonsplitterServer = void 0;
const oberknecht_jsonsplitter_1 = require("oberknecht-jsonsplitter");
const jsonsplitterServer_options_1 = require("../types/jsonsplitterServer.options");
const ws_1 = require("ws");
const oberknecht_utils_1 = require("oberknecht-utils");
let wsSymNum = 0;
let wsData = {};
class jsonsplitterServer extends oberknecht_jsonsplitter_1.jsonsplitter {
    wsServer;
    wsServerOptions;
    constructor(options) {
        super(options);
        this.wsServerOptions = options ?? {};
    }
    async connectServer() {
        this.wsServer = new ws_1.WebSocketServer({
            port: this.wsServerOptions.serverWSPort ?? jsonsplitterServer_options_1.defaults.serverWSPort,
        });
        this.wsServer.on("listening", async () => {
            this.emit(["wsserver", "listening"]);
            if (this.wsServerOptions.debug > 1)
                (0, oberknecht_utils_1.log)(1, 
                // @ts-ignore
                `WSServer Listening on ${this.wsServer.address().address} (${
                // @ts-ignore
                this.wsServer.address().family
                // @ts-ignore
                }) port ${this.wsServer.address().port}`);
        });
        this.wsServer.on("error", async (e) => {
            this.emit(["wsserver", "wsserver-error"], e);
            this.emitError(e);
        });
        this.wsServer.on("connection", async (ws) => {
            const wsSym = `oberknechtServer-ws-${wsSymNum++}`;
            this.emit([
                "wsserver",
                "wsserver-connection",
                `wsserver-ws-${wsSym}`,
                `wsserver-ws-${wsSym}-connection`,
            ], ws);
            wsData[wsSym] = {};
            function sendWC(stuff, status) {
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
                ws.send(Buffer.from(JSON.stringify(stuff_)));
            }
            // @ts-expect-error
            ws.sendWC = sendWC;
            ws.on("message", async (rawMessage) => {
                this.emit([
                    "wsserver",
                    "wsserver-message",
                    `wsserver-ws-${wsSym}`,
                    `wsserver-ws-${wsSym}-message`,
                ], rawMessage);
                if (!wsData[wsSym].messageNum)
                    wsData[wsSym].messageNum = 0;
                const messageID = `${wsSym}-msg-${wsData[wsSym].messageNum++}`;
                if (!oberknecht_utils_1.regex.jsonreg().test(rawMessage.toString()))
                    return sendWC({
                        error: Error("message does not match json regex"),
                    });
                let message;
                try {
                    message = JSON.parse(rawMessage.toString());
                }
                catch (e) {
                    return sendWC({ error: Error("could not parse message as JSON") });
                }
                let parameters = message.parameters;
                let pass = message.pass;
                let type = message.type;
                if (!["login"].includes(type) && !wsData[wsSym].authorized)
                    return sendWC({
                        error: Error("not authorized - login required"),
                        parameters: parameters,
                        messageID: messageID,
                        type: type,
                        pass: pass,
                    }, 401);
                switch (type) {
                    case "login": {
                        let password = message.password;
                        if (this.wsServerOptions.serverWSPassword &&
                            (!password || password !== this.wsServerOptions.serverWSPassword))
                            return sendWC({
                                error: Error("password is not defined or does not match server password"),
                                parameters: parameters,
                                messageID: messageID,
                                type: type,
                                pass: pass,
                            });
                        wsData[wsSym].authorized = true;
                        return sendWC({
                            message: "Success",
                            parameters: parameters,
                            messageID: messageID,
                            type: type,
                            pass: pass,
                        });
                    }
                    default: {
                        let func = this[type];
                        if (!func)
                            return sendWC({
                                error: Error("method not found"),
                                parameters: parameters,
                                messageID: messageID,
                                type: type,
                                pass: pass,
                            });
                        if (!Array.isArray(parameters))
                            return sendWC({
                                error: Error("key parameters has to be an array"),
                                parameters: parameters,
                                messageID: messageID,
                                type: type,
                                pass: pass,
                            });
                        try {
                            let res = await func(...parameters);
                            return sendWC({
                                response: res,
                                parameters: parameters,
                                messageID: messageID,
                                type: type,
                                pass: pass,
                            });
                        }
                        catch (e) {
                            return sendWC({
                                error: e,
                                parameters: parameters,
                                messageID: messageID,
                                type: type,
                                pass: pass,
                            });
                        }
                    }
                }
            });
            ws.on("close", (code) => {
                this.emit([
                    "wsserver",
                    "wsserver-close",
                    `wsserver-ws-${wsSym}`,
                    `wsserver-ws-${wsSym}-close`,
                ], code);
                wsClose();
            });
            function wsClose() {
                if ([0, 1].includes(ws.readyState))
                    ws?.close();
                if (wsData[wsSym]?.heartbeat?.heartbeatInterval)
                    clearInterval(wsData[wsSym].heartbeat.heartbeatInterval);
                delete wsData[wsSym];
            }
            wsData[wsSym].heartbeatInterval = setInterval(() => {
                if (!wsData[wsSym].heartbeat)
                    wsData[wsSym].heartbeat = {};
                if ((wsData[wsSym].heartbeat.pingsPending ?? 0) >=
                    this.wsServerOptions.serverWSMaxPendingPings) {
                    return close();
                }
                wsData[wsSym].heartbeat.pingStart = Date.now();
                wsData[wsSym].heartbeat.pingsPending =
                    (wsData[wsSym].heartbeat.pingsPending ?? 0) + 1;
                ws.ping();
            }, this.wsServerOptions.serverWSHeartbeatInterval ?? 30000);
            ws.on("ping", () => {
                ws.pong();
            });
            ws.on("pong", () => {
                this.emit([
                    "wsserver",
                    "wsserver-pong",
                    `wsserver-ws-${wsSym}`,
                    `wsserver-ws-${wsSym}-pong`,
                ]);
                if (!wsData[wsSym].heartbeat)
                    return;
                wsData[wsSym].heartbeat.pingsPending = 0;
                wsData[wsSym].heartbeat.lastPong = Date.now();
            });
        });
    }
}
exports.jsonsplitterServer = jsonsplitterServer;
