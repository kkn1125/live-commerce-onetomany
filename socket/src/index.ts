/* A quite detailed WebSockets upgrade example "async" */

import uWS from "uWebSockets.js";
import { PORT } from "./util/global";
import { dev } from "./util/tool";

import { Message, Field } from "protobufjs";

Field.d(1, "float", "optional")(Message.prototype, "id");
Field.d(2, "float", "optional")(Message.prototype, "test");

const app = uWS
  ./*SSL*/ App({
    // key_file_name: "misc/key.pem",
    // cert_file_name: "misc/cert.pem",
    // passphrase: "1234",
  })
  .ws("/*", {
    /* Options */
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 32,
    /* Handlers */
    upgrade: (res, req, context) => {
      dev.log(
        "An Http connection wants to become WebSocket, URL: " +
          req.getUrl() +
          "!"
      );

      /* Keep track of abortions */
      const upgradeAborted = { aborted: false };

      /* You MUST copy data out of req here, as req is only valid within this immediate callback */
      const url = req.getUrl();
      const secWebSocketKey = req.getHeader("sec-websocket-key");
      const secWebSocketProtocol = req.getHeader("sec-websocket-protocol");
      const secWebSocketExtensions = req.getHeader("sec-websocket-extensions");

      /* Simulate doing "async" work before upgrading */
      setTimeout(() => {
        dev.log(
          "We are now done with our async task, let's upgrade the WebSocket!"
        );

        if (upgradeAborted.aborted) {
          dev.log("Ouch! Client disconnected before we could upgrade it!");
          /* You must not upgrade now */
          return;
        }

        /* This immediately calls open handler, you must not use res after this call */
        res.upgrade(
          {
            url: url,
          },
          /* Use our copies here */
          secWebSocketKey,
          secWebSocketProtocol,
          secWebSocketExtensions,
          context
        );
      }, 1000);

      /* You MUST register an abort handler to know if the upgrade was aborted by peer */
      res.onAborted(() => {
        /* We can simply signal that we were aborted */
        upgradeAborted.aborted = true;
      });
    },
    open: (ws) => {
      const webSocketOption = ws as unknown as { url: string };
      dev.log("A WebSocket connected with URL: " + webSocketOption.url);
    },
    message: (ws, message, isBinary) => {
      /* Ok is false if backpressure was built up, wait for drain */
      // let ok = ws.send(message, isBinary);
      if (isBinary) {
        handleBinary(ws, message);
      } else {
        handleNotBinary(ws, message);
      }
    },
    drain: (ws) => {
      dev.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      dev.log("WebSocket closed");
    },
  })
  .any("/*", (res, req) => {
    res.end("Nothing to see here!");
  })
  .listen(PORT, (token) => {
    if (token) {
      dev.log("Listening to port " + PORT);
    } else {
      dev.log("Failed to listen to port " + PORT);
    }
  });

function handleBinary(ws: uWS.WebSocket<unknown>, message: ArrayBuffer) {
  app;
  const uint8 = new Uint8Array(message);
  const decoded = Message.decode(uint8).toJSON();
  dev.alias("binary data").log(decoded);
  ws.send(message, true);
}

function handleNotBinary(ws: uWS.WebSocket<unknown>, message: ArrayBuffer) {
  app;
  const decoded = new TextDecoder().decode(message);
  const parsed = JSON.parse(decoded);
  dev.alias("non-binary data").log(parsed);
  ws.send(message);
}
