import React from "react";
import ReactDOM from "react-dom/client";
import { WebgazerProvider } from "@webgazer-ts/react";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WebgazerProvider>
      <App />
    </WebgazerProvider>
  </React.StrictMode>
);