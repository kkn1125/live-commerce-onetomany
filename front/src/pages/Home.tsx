import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import React, { ChangeEvent, useEffect, useState } from "react";
import LiveSocket from "../model/LiveSocket";

let ls: LiveSocket | null;

function Home() {
  const [content, setContent] = useState("");
  const [chatList, setChatList] = useState<
    {
      signal: string;
      type: string;
      data: { [k: string]: any };
    }[]
  >([]);
  useEffect(() => {
    ls = new LiveSocket("ws", "localhost", 4000);
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
    ls.addEventListener("signal", handleSignal);
    return () => {
      if (ls) {
        ls.removeEventListener("signal", handleSignal);
        ls.disconnect();
      }
      ls = null;
    };
  }, []);
  const initialInput = () => {
    setContent("");
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.currentTarget.value);
  };
  const sendSignal = () => {
    ls?.signaling("signal:test", {
      content,
    });
  };
  const handleSignal = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendSignal();
      initialInput();
    }
  };
  const handleClickSignal = () => {
    sendSignal();
    initialInput();
  };
  return (
    <Stack>
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
          onKeyDown={handleSignal}
          value={content}
        />
        <Button onClick={handleClickSignal}>send signal</Button>
      </Stack>
    </Stack>
  );
}

export default Home;
