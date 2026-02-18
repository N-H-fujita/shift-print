import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";

declare global {
  interface Window {
    SHIFT_DATA?: unknown;
  }
}

createRoot(document.getElementById('root')!).render(<App />);