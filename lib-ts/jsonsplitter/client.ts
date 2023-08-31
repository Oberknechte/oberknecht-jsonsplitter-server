import { WebSocket } from "ws";
import { jsonsplitterClientOptions } from "../types/jsonsplitterClient.options";
import { defaults } from "../types/jsonsplitterServer.options";
import { convertToArray, log, regex, returnErr } from "oberknecht-utils";
import { oberknechtEmitter } from "oberknecht-emitters";
function onCallback(callback: any) {}

export class jsonsplitterClient {
  wsClient: WebSocket;
  wsClientOptions: jsonsplitterClientOptions;
  wsAddress: string;
  oberknechtEmitter = new oberknechtEmitter();
  #wsMessageNum = 0;
  get wsMessageNum() {
    return this.#wsMessageNum++;
  }

  get isConnected() {
    return this.wsClient.readyState === 1;
  }

  constructor(options: jsonsplitterClientOptions) {
    let options_ = options ?? {};
    if (!options_.debug) options_.debug = 1;
    this.wsClientOptions = options ?? {};
  }

  on = (type: string, callback: typeof onCallback) => {
    return this.oberknechtEmitter.on(type, callback);
  };

  once = (type: string, callback: typeof onCallback) => {
    return this.oberknechtEmitter.once(type, callback);
  };

  emit = (eventname: string | string[], args?: any) => {
    return this.oberknechtEmitter.emit(eventname, args);
  };

  async sendWC(
    stuff: Record<string, any> | any,
    status?: number,
    cb?: Function
  ) {
    const messageID = `${this.wsMessageNum}`;
    let this_ = this;

    if (this.wsClient.readyState === 0)
      await new Promise<void>((resolve) => {
        function waitTo() {
          setTimeout(() => {
            if (this_.wsClient.readyState !== 0) return resolve();
            waitTo();
          }, 100);
        }

        waitTo();
      });

    let stuff_: Record<string, any> = {};
    if (typeof stuff === "object") stuff_ = stuff;
    else stuff_.data = stuff;

    stuff_.status = status ?? 200;

    if (stuff?.error || stuff instanceof Error) {
      stuff_.error = returnErr(stuff);
      stuff_.status = status ?? 400;
    }

    stuff_.pass = messageID;

    this.wsClient.send(Buffer.from(JSON.stringify(stuff_)));
    // @ts-ignore
    if (cb) return this.once(`ws-message-pass:${messageID}`, cb);

    return new Promise((resolve, reject) => {
      this.once(`ws-message-pass:${messageID}`, (c) => {
        resolve(c);
      });
    });
  }

  sendType = async (
    type?: string,
    parameters?: any,
    stuff?: Record<string, any>,
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return new Promise((resolve, reject) => {
      this.sendWC({
        ...(stuff ?? {}),
        ...(type ? { type: type } : {}),
        ...(parameters ? { parameters: parameters } : {}),
      })
        .then((r: Record<string, any>) => {
          if (r.error && !noReject) return reject(r.error);

          resolve(transportDetails ? r : r.response);
        })
        .catch(reject);
    });
  };

  sendTypeSync = (
    type?: string,
    parameters?: any,
    stuff?: Record<string, any>,
    cb?: Function
  ) => {
    let cb_ = (args) => {
      if (cb) cb(args);
      return args;
    };
    this.sendWC(
      {
        ...(stuff ?? {}),
        ...(type ? { type: type } : {}),
        ...(parameters ? { parameters: parameters } : {}),
      },
      undefined,
      cb_
    );
  };

  async connectClient() {
    this.wsAddress =
      this.wsClientOptions.serverWSAddress ??
      `ws${this.wsClientOptions.serverWSSecure ? "s" : ""}://127.0.0.1:${
        this.wsClientOptions.serverWSPort ?? defaults.serverWSPort
      }`;

    let ws = (this.wsClient = new WebSocket(this.wsAddress));

    this.wsClient.on("open", () => {
      if (this.wsClientOptions.debug > 1)
        log(1, `WSClient Opened WS Connection to ${this.wsAddress}`);

      this.sendWC({
        type: "login",
        ...(this.wsClientOptions.serverWSPassword
          ? { password: this.wsClientOptions.serverWSPassword }
          : {}),
      });
    });

    this.wsClient.on("message", (rawMessage_) => {
      const rawMessage = Buffer.from(rawMessage_.toString()).toString("utf-8");

      if (!regex.jsonreg().test(rawMessage)) return;
      let message;
      try {
        message = JSON.parse(rawMessage);
      } catch (e) {
        return;
      }

      if (message.messageID)
        this.emit([`ws-message:${message.messageID}`], message);
      if (message.pass) this.emit([`ws-message-pass:${message.pass}`], message);
    });
  }

  createcb = (cb) => {
    return (
      cb ??
      ((...args: any) => {
        return args;
      })
    );
  };

  getKeySync = (
    keypath: string | string[],
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return this.sendType(
      "getKeySync",
      [convertToArray(keypath)],
      undefined,
      noReject,
      transportDetails
    );
  };

  addKeySync = (
    keypath: string | string[],
    value?: any,
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return this.sendType(
      "addKeySync",
      [convertToArray(keypath), value],
      undefined,
      noReject,
      transportDetails
    );
  };

  editKeySync = (
    keypath: string | string[],
    value?: any,
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return this.sendType(
      "editKeySync",
      [convertToArray(keypath), value],
      undefined,
      noReject,
      transportDetails
    );
  };

  editKeyAddSync = (
    keypath: string | string[],
    value?: any,
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return this.sendType(
      "editKeyAddSync",
      [convertToArray(keypath), value],
      undefined,
      noReject,
      transportDetails
    );
  };

  deleteKeySync = (
    keypath: string | string[],
    noReject?: boolean,
    transportDetails?: boolean
  ) => {
    return this.sendType(
      "deleteKeySync",
      [convertToArray(keypath)],
      undefined,
      noReject,
      transportDetails
    );
  };
}
