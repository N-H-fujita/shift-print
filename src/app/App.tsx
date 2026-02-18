import React from "react";
import { PrintPage } from "../ui/PrintPage";

export function App() {
  return (
    <div className="min-h-dvh bg-neutral-100 p-4 print:bg-white print:p-0">
      <PrintPage />
    </div>
  );
}