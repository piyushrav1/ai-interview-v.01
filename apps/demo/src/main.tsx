import React from "react";
import { createRoot } from "react-dom/client";

import "@testmeman/ui";

createRoot(document.getElementById("root")!).render(
  React.createElement(React.Fragment, null, "TestMeMan AI Interviewer demo"),
);