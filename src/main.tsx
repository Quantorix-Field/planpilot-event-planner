import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyMotion, readMotion } from "./motion";
import "./theme.css";
import "./styles.css";
import "./shell.css";
import "./plans.css";
import "./plan-detail.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root was not found.");

applyMotion(readMotion());

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
