import { convertParamsToQuerystring, dev } from "../util/tool";
import protobufjs from "protobufjs";

const { Field, Message } = protobufjs;

function alreadyHasKey(key: string) {
  return !protobufjs.Message.$type?.fields.hasOwnProperty(key);
}
const fields = ["id", "test", "signal", "type", "data"];

fields.forEach((field, i) => {
  alreadyHasKey(field)
    ? Field.d(i, "string", "optional")(Message.prototype, field)
    : null;
});

type EventType = "signal";
type EventCallback =
  | ((signal: string, type: string, data: object) => void)
  | (() => void);
type EventResolve = (value: {
  signal: string;
  type: string;
  data: object;
}) => void;
type EventItem = { resolve: EventResolve; cb: EventCallback };
type Events = {
  [k in EventType]?: EventItem;
};

export default class LiveSocket {
  path: string;
  socket: WebSocket;
  signalData?: {
    signal: string;
    data: object;
  };

  customEventListener: { [k: string]: EventCallback[] };
  events?: Events;

  #intialEvents(type: EventType) {
    if (this.events) {
      this.events[type] = {
        resolve: () => {},
        cb: () => {},
      };
    }
  }

  addEventListener(type: EventType, cb: EventCallback) {
    if (this.events && !this.events[type]) {
      this.#intialEvents(type);
    }
    if (this.events && this.events[type]) {
      switch (type) {
        case "signal":
          (this.events[type] as EventItem).cb = cb;
          return;
        default:
          return;
      }
    }
  }

  removeEventListener(type: EventType, cb: EventCallback) {
    if (this.events && (this.events[type] as EventItem).cb === cb) {
      this.#intialEvents(type);
    }
  }

  on(type: EventType | string, cb: EventCallback) {
    if (!this.customEventListener[type]) this.customEventListener[type] = [];
    this.customEventListener[type].push(cb);
  }

  emit(type: EventType | string) {
    this.customEventListener[type].forEach((cb) => (cb as any).call(this));
  }

  disconnect() {
    dev.alias("socket close!").log("done");
    this.socket.close();
  }

  constructor(
    public protocol: string,
    public host: string,
    public port: number | string = 4000,
    public params: string | object = ""
  ) {
    // this.signalEvent = () => {};
    this.events = {};
    this.customEventListener = {};
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
  onOpen = (e: Event) => {
    dev.alias("socket").debug("connect");
    this.sendToBinary({ test: 123 });
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
      dev.alias("💻 socket binary message").debug(message);

      if (message.signal && message.signal.startsWith("signal:")) {
        const signal = message.signal;
        const type = message.signal.slice(7);
        const data = JSON.parse(message.data);
        dev.alias("signaling type").debug(signal);
        dev.alias("signaling data").debug(data);
        setTimeout(() => {
          this.events?.["signal"]?.resolve({ signal, type, data });
          // console.log("진입");
          // console.log(this.signalEvent);
          this.events?.["signal"]?.cb(signal, type, data);
        }, 0);
      }
    }
  };

  sendToBinary(message: string | object) {
    // const encode = protobuf.Message.encode(message as object);
    let temp = typeof message === "string" ? { message } : message;
    const encoded = Message.encode(Message.fromObject(temp)).finish();

    dev.alias("📜 my binary message").debug(encoded);

    this.socket.send(encoded);
  }

  sendToString(message: string | object) {
    const encoded =
      typeof message !== "string" ? JSON.stringify(message) : message;

    dev.alias("📜 my non-binary message").debug(encoded);

    this.socket.send(encoded);
  }

  async signaling(signal: string, data: object) {
    this.sendToBinary({
      signal,
      data: JSON.stringify(data),
    });
    return new Promise((resolve) => {
      (this.events?.["signal"] as EventItem).resolve = resolve;
    });
  }
}
