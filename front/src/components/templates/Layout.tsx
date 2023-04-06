import { Box, Stack } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}

export default Layout;
