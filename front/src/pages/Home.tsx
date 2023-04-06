import { Box, Button, Stack } from "@mui/material";
import React, { useState } from "react";
import LiveSocket from "../model/LiveSocket";

const ls = new LiveSocket("ws", "localhost", 4000);

function Home() {
  return (
    <Box>
      <Stack direction='row' gap={10}></Stack>
    </Box>
  );
}

export default Home;
