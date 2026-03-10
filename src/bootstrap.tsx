import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("[host-shell] Root element #root not found in the DOM.");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
