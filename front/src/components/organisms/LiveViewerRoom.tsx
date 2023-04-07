import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import React, { ChangeEvent, useEffect, useState } from "react";
import LiveSocket from "../../model/LiveSocket";
import { dev } from "../../util/tool";
import LiveVideoRoom from "./LiveVideoRoom";

function LiveViewerRoom({ liveSocket }: { liveSocket: LiveSocket }) {
  useEffect(() => {
    async function start() {
      liveSocket.listenOffer = (data) => {

      };
      liveSocket.listenAnswer = (data) => {};
      liveSocket.listenIce = (data) => {};
    }
    start();
  }, []);
  return <Stack></Stack>;
}

export default LiveViewerRoom;
