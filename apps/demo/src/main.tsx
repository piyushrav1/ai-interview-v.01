import React from "react";
import { createRoot } from "react-dom/client";
import { InterviewRoom } from "@testmeman/ui";
import "./index.css";
import "@testmeman/ui/src/styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InterviewRoom />
  </React.StrictMode>,
);
