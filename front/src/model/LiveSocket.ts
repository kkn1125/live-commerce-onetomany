import { convertParamsToQuerystring, dev } from "../util/tool";
import protobufjs from "protobufjs";

const { Field, Message } = protobufjs;

Field.d(1, "float", "optional")(Message.prototype, "id");
Field.d(2, "float", "optional")(Message.prototype, "test");

export default class LiveSocket {
  path: string;
  socket: WebSocket;

  constructor(
    public protocol: string,
    public host: string,
    public port: number | string = 4000,
    public params: string | object = ""
  ) {
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
  };

  onError = (e: Event) => {
    dev.alias("📢 error").debug(e);
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
    }
  };

  sendToBinary(message: string | object) {
    // const encode = protobuf.Message.encode(message as object);
    let temp = typeof message === "string" ? { message } : message;
    const encoded = Message.encode(new Message(temp)).finish();

    dev.alias("📜 my binary message").debug(encoded);

    this.socket.send(encoded);
  }

  sendToString(message: string | object) {
    const encoded =
      typeof message !== "string" ? JSON.stringify(message) : message;

    dev.alias("📜 my non-binary message").debug(encoded);

    this.socket.send(encoded);
  }
}
