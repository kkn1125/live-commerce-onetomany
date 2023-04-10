import { Box } from "@mui/material";
import React, { useEffect } from "react";
import LiveSocket from "../../model/LiveSocket";
import LiveWebRTC from "../../model/LiveWebRTC";
import { dev } from "../../util/tool";

function LiveVideoRoom({ liveSocket }: { liveSocket: LiveSocket }) {
  // console.log(LiveVideoRoom)
  useEffect(() => {
    async function start() {
      await liveSocket.rtc?.connectWebCam();
      liveSocket.rtc?.createOffer();
      liveSocket.rtc?.on(
        "icecandidate",
        function (this: LiveWebRTC, candidate) {
          dev.alias("ice candidate").debug(candidate);
          liveSocket.signaling(LiveSocket.ADD.OFFER, {
            offer: this.offer,
          });
        }
      );
    }
    start();
  }, []);
  return <Box id='main-video'></Box>;
}

export default LiveVideoRoom;
