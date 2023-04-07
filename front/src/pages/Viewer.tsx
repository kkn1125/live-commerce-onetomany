import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import React, { ChangeEvent, useEffect, useState } from "react";
import LiveViewerRoom from "../components/organisms/LiveViewerRoom";
import LiveSocket from "../model/LiveSocket";
import { dev } from "../util/tool";

function Viewer() {
  const [content, setContent] = useState("");
  const [liveSocket, setLiveSocket] = useState<LiveSocket | null>(null);
  const [isOpenSocket, setIsOpenSocket] = useState(false);
  const [chatList, setChatList] = useState<
    {
      signal: string;
      type: string;
      data: { [k: string]: any };
    }[]
  >([]);

  useEffect(() => {
    const liveSocket = new LiveSocket("ws", "localhost", 4000);

    liveSocket.on(LiveSocket.SIGNAL.CHAT, handleSignal);
    liveSocket.on("custom:test", handleTestSignal);

    setLiveSocket(liveSocket);

    liveSocket.openning = (result) => {
      console.log("socket open!!", result);
      setIsOpenSocket((isOpenSocket) => true);
    };
    if (!liveSocket.rtc) return;

    function handleSignal(signal: any, type: any, data: any) {
      console.log(signal, type, data);
      setChatList((chatList) => [
        ...chatList,
        {
          signal,
          type,
          data,
        },
      ]);
    }
    function handleTestSignal(signal: any, type: any, data: any) {
      // console.log(signal, type, data);
      setChatList((chatList) => [
        ...chatList,
        {
          signal,
          type,
          data,
        },
      ]);
    }

    return () => {
      liveSocket.disconnect();
      setLiveSocket(null);
    };
  }, []);

  /* utils */
  const initialInput = () => {
    setContent("");
  };
  const sendSignal = () => {
    liveSocket
      ?.signaling(LiveSocket.SIGNAL.CHAT, {
        content,
      })
      .then((result) => {
        dev.alias("result").log(result);
      });
  };
  const sendSignalTest = () => {
    liveSocket?.signaling("custom:test", {
      content,
    });
  };

  /* handlers */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.currentTarget.value);
  };
  const handleKeyDownSignal = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendSignal();
      initialInput();
    }
  };
  const handleClickSignal = () => {
    sendSignal();
    initialInput();
  };
  const handleClickSignalTest = () => {
    sendSignalTest();
    initialInput();
  };
  return (
    <Stack>
      {liveSocket && isOpenSocket && <LiveViewerRoom liveSocket={liveSocket} />}
      <Box>
        {chatList.map(({ signal, type, data }, i) => (
          <Stack direction='row' gap={3} key={i}>
            <Typography>{type}</Typography>
            <Typography>{data.content}</Typography>
          </Stack>
        ))}
      </Box>
      <Stack direction='row' gap={10}>
        <TextField
          onChange={handleChange}
          onKeyDown={handleKeyDownSignal}
          value={content}
        />
        <Button onClick={handleClickSignal}>send signal</Button>
        <Button onClick={handleClickSignalTest}>send test signal</Button>
      </Stack>
    </Stack>
  );
}

export default Viewer;
