import React from "react";
import { createRoot } from "react-dom/client";

declare global {
  interface Window {
    SHIFT_DATA?: unknown;
  }
}

const App = () => {
  return (
    <div style={{ padding:16, fontFamily: "system-ui, sans-serif" }}>
      <h1>Shift Print Tool</h1>
      <pre>{JSON.stringify(window.SHIFT_DATA ?? null, null, )}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />);