import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import React, { ChangeEvent, useEffect, useState } from "react";
import { v4 } from "uuid";
import LiveVideoRoom from "../components/organisms/LiveVideoRoom";
import LiveSocket from "../model/LiveSocket";
import LiveWebRTC from "../model/LiveWebRTC";
import { dev } from "../util/tool";

// let ls: LiveSocket;

function Home() {
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

    liveSocket.on(LiveSocket.SIGNAL.CHAT, (signal, type, data) => {
      setChatList((chatList) => [
        ...chatList,
        {
          signal,
          type,
          data,
        },
      ]);
    });
    liveSocket.on(LiveSocket.LOAD.ROOM, (signal, type, data) => {
      console.log(data);
    });
    liveSocket.on(LiveSocket.CUSTOM("test"), (signal, type, data) => {
      setChatList((chatList) => [
        ...chatList,
        {
          signal,
          type,
          data,
        },
      ]);
    });
    liveSocket.on(LiveSocket.ADD.ROOM, (signal, type, data) => {});

    setLiveSocket(liveSocket);

    liveSocket.onopenning = (result) => {
      console.log("socket open!!", result);
      liveSocket.signaling(LiveSocket.ADD.ROOM, { id: v4() });
      liveSocket.signaling(LiveSocket.ADD.USER, { id: v4() });
      setIsOpenSocket((isOpenSocket) => true);
    };
    if (!liveSocket.rtc) return;

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
    liveSocket?.signaling(LiveSocket.CUSTOM("test"), {
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
    liveSocket?.signaling(LiveSocket.LOAD.ROOM, {
      request: true,
    });
    initialInput();
  };
  return (
    <Stack>
      {liveSocket && isOpenSocket && <LiveVideoRoom liveSocket={liveSocket} />}
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

export default Home;
