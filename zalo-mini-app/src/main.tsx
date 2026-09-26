import "zmp-ui/zaui.css";
import "./app.css";
import React from "react";
import { createRoot } from "react-dom/client";
import UngDung from "./app";

createRoot(document.getElementById("app")!).render(React.createElement(UngDung));
