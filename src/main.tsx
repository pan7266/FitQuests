import { registerSW } from "virtual:pwa-register";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./styles/globals.css";
import "./styles/themes.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Fit Quest root element was not found.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerSW({ immediate: true });
