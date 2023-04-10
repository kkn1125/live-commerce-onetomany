import {
  convertParamsToQuerystring,
  queryParser,
  dev,
  customParser,
} from "../util/tool";
import protobufjs from "protobufjs";
import LiveWebRTC from "./LiveWebRTC";

const { Field, Message } = protobufjs;

function alreadyHasKey(key: string) {
  return !protobufjs.Message.$type?.fields.hasOwnProperty(key);
}
const fields = ["id", "test", "signal", "type", "data", "server", "client"];

fields.forEach((field, i) => {
  alreadyHasKey(field)
    ? Field.d(
        i,
        field.match(/server|client/) ? "bool" : "string",
        "optional"
      )(Message.prototype, field)
    : null;
});

// type RoomType = "room"
type DataType = "offer" | "answer" | "room" | "user";
type SignalType = "chat" | "ice";

type SignalEventType = `signal:${SignalType}` | `custom:${string}`;
type DataEventType = `load:${DataType}` | `add:${DataType}`;
type EventType = SignalEventType | DataEventType;
type EventCallback =
  | ((
      signal: string,
      type: string,
      data: object,
      server?: boolean,
      client?: boolean
    ) => void)
  | (() => void);
type EventResolve = (value: SignalDataType) => void;
type EventItem = { resolve: EventResolve; cb: EventCallback };
type Events = {
  [k in EventType]?: EventItem;
};

interface SignalDataType {
  signal?: EventType;
  type?: SignalType;
  data?: string;
  server?: boolean;
  client?: boolean;
}

export default class LiveSocket {
  static readonly SIGNAL: { [k in "CHAT" | "ICE"]: SignalEventType } = {
    CHAT: "signal:chat",
    ICE: "signal:ice",
  };
  static readonly CUSTOM = (type: string): SignalEventType => `custom:${type}`;
  static readonly ADD: {
    [k in "OFFER" | "ANSWER" | "ROOM" | "USER"]: DataEventType;
  } = {
    USER: "add:user",
    ROOM: "add:room",
    OFFER: "add:offer",
    ANSWER: "add:answer",
  };
  static readonly LOAD: {
    [k in "OFFER" | "ANSWER" | "ROOM" | "USER"]: DataEventType;
  } = {
    USER: "load:user",
    ROOM: "load:room",
    OFFER: "load:offer",
    ANSWER: "load:answer",
  };

  path: string;
  socket: WebSocket;
  events: Events;
  customEvents: Events;
  signalData: SignalDataType;
  rtc?: LiveWebRTC;
  onopenning?: (a: boolean) => void;
  listenOffer?: (data: any) => void;
  listenAnswer?: (data: any) => void;
  listenIce?: (data: any) => void;

  constructor(
    public protocol: string,
    public host: string,
    public port: number | string = 4000,
    public params: string | object = ""
  ) {
    this.events = {};
    this.customEvents = {};
    this.signalData = {};
    this.protocol = protocol;
    this.host = host;
    this.port = Number(port);
    this.params = params;
    const convertedParams = convertParamsToQuerystring(this.params);
    const path =
      this.protocol + "://" + this.host + ":" + this.port + convertedParams;
    const socket = new WebSocket(path);
    socket.binaryType = "arraybuffer";

    socket.onopen = this.onOpen;
    socket.onclose = this.onClose;
    socket.onerror = this.onError;
    socket.onmessage = this.onMessage;
    this.path = path;
    this.socket = socket;
  }

  /* socket features */
  disconnect() {
    dev.alias("socket close!").log("done");
    this.socket.close();
  }
  sendToBinary(message: string | object) {
    // const encode = protobuf.Message.encode(message as object);
    let temp =
      typeof message === "string"
        ? { message, client: true, server: false }
        : Object.assign(message, { client: true, server: false });
    const encoded = Message.encode(Message.fromObject(temp)).finish();

    dev.alias("📜 my binary message origin").debug(message);
    // dev.alias("📜 my binary message").debug(encoded);

    this.socket.send(encoded);
  }
  sendToString(message: string | object) {
    const encoded =
      typeof message !== "string" ? JSON.stringify(message) : message;

    dev.alias("📜 my non-binary message origin").debug(message);
    // dev.alias("📜 my non-binary message").debug(encoded);

    this.socket.send(encoded);
  }

  /* socket events */
  onOpen = (e: Event) => {
    dev.alias("socket").debug("connect");
    // this.sendToBinary({ test: 123 });
    this.rtc = new LiveWebRTC({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
        {
          urls: "turn:192.158.29.39:3478?transport=udp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
        {
          urls: "turn:192.158.29.39:3478?transport=tcp",
          credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
          username: "28224511:1379330808",
        },
      ],
    });
    this.rtc?.createPeer();

    this.checkOpen();
  };
  onClose = (e: CloseEvent) => {
    dev.alias("❌ socket").debug("disconnect");
    this.disconnect();
  };
  onError = (e: Event) => {
    dev.alias("📢 error").debug(e);
    this.disconnect();
  };
  onMessage = ({ data }: MessageEvent) => {
    if (typeof data === "string") {
      // non-binary data
      const message = JSON.parse(data);
      dev.alias("💻 socket non-binary message").debug(message);
    } else {
      // binary data
      const message = Message.decode(new Uint8Array(data)).toJSON();
      // const message = JSON.parse(data);
      const parsedMessage = queryParser(message);
      dev.alias("💻 socket binary message").debug(parsedMessage);

      if (message.signal.match(/(add):(offer|answer)/)) {
        const signal = parsedMessage.signal as EventType;
        const type = parsedMessage.signal.slice(7);
        const data = parsedMessage.data;
        const server = parsedMessage.server;
        const client = parsedMessage.client;

        if (type === "offer") {
          (this.rtc as LiveWebRTC).remoteOffer = data.offer;
          this.listenOffer?.call(this, data.offer);
        } else if (type === "answer") {
          (this.rtc as LiveWebRTC).remoteAnswer = data.answer;
          this.listenAnswer?.call(this, data.answer);
        }
        setTimeout(() => {
          (this.events as Events)[signal as EventType]?.resolve({
            signal,
            type,
            data,
            server,
            client,
          });
          (this.events as Events)[signal as EventType]?.cb(
            signal,
            type,
            data,
            server,
            client
          );
        }, 0);
      } else {
        if (
          message.signal &&
          (message.signal.startsWith("signal:") ||
            message.signal.startsWith("custom:"))
        ) {
          const signal = parsedMessage.signal as EventType;
          const type = parsedMessage.signal.slice(7);
          const data = parsedMessage.data;
          const server = parsedMessage.server;
          const client = parsedMessage.client;

          if (type === "ice") {
            this.listenIce?.call(this, data.ice);
          }

          setTimeout(() => {
            (this.events as Events)[signal as EventType]?.resolve({
              signal,
              type,
              data,
              server,
              client,
            });
            (this.events as Events)[signal as EventType]?.cb(
              signal,
              type,
              data,
              server,
              client
            );
          }, 0);
        }
      }
    }
  };

  /* socket event controllers */
  #initialEvent(type: EventType) {
    if (!this.events[type]) {
      this.events[type] = {
        resolve: () => {},
        cb: () => {},
      };
    }
  }

  #setEvent(type: EventType, cb: EventCallback) {
    if (this.events && this.events[type]) {
      (this.events[type] as EventItem).cb = cb;
    }
  }

  checkOpen() {
    this.onopenning?.(!!this.rtc);
  }

  on(type: EventType, cb: EventCallback) {
    // signal type event
    this.#initialEvent(type);
    this.#setEvent(type, cb);
  }

  async signaling(signal: EventType, data: object) {
    this.sendToBinary({
      signal,
      data: JSON.stringify(data),
    });
    return new Promise((resolve) => {
      this.#initialEvent(signal);
      // signal type event
      (this.events?.[signal] as EventItem).resolve = resolve;
    });
  }
}
