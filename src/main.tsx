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
      <h1 className="p-6 text-3xl font-bold text-blue-600">
        Shift Print Tool
      </h1>
      <pre>{JSON.stringify(window.SHIFT_DATA ?? null, null, )}</pre>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />);