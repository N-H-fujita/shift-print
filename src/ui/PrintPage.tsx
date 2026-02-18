import React from "react";

type ShiftData = {
  version?: number;
  note?: string;
};

function readShiftData(): ShiftData | null {
  // data.js は window.SHIFT_DATA を想定（無い場合は null）
  const w = window as unknown as { SHIFT_DATA?: unknown };
  if (!("SHIFT_DATA" in w)) return null;
  return (w.SHIFT_DATA as ShiftData) ?? null;
}

function formatMonthLabel(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatPrintedAt(date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${mo}/${d} ${h}:${mi}`;
}

export function PrintPage() {
  const monthLabel = formatMonthLabel();
  const printedAt = formatPrintedAt();
  const data = readShiftData();

  return (
    <main className="mx-auto w-fit">
      {/* 印刷対象の“用紙” */}
      <section className="sheet flex flex-col bg-white text-black shadow print:shadow-none">
        {/* ヘッダー */}
        <header className="flex items-end justify-between border-b border-neutral-300 pb-2">
          <div>
            <h1 className="text-lg font-bold">シフト表印刷ツール</h1>
            <p className="text-sm text-neutral-700">対象月: {monthLabel}</p>
          </div>
          <div className="text-right text-xs text-neutral-600">
            <div>印刷: {printedAt}</div>
            <div>data: {data ? JSON.stringify(data) : "null"}</div>
          </div>
        </header>

        {/* 2段（上段 / 下段） */}
        <div className="mt-3 grid flex-1 grid-rows-2 gap-3">
          <section className="panel">
            <PanelTitle>上段</PanelTitle>
            <PanelBody />
          </section>

          <section className="panel">
            <PanelTitle>下段</PanelTitle>
            <PanelBody />
          </section>
        </div>
      </section>
    </main>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-neutral-800">{children}</h2>
      <span className="text-[11px] text-neutral-500">（ここに表が入る）</span>
    </div>
  );
}

function PanelBody() {
  // 一旦“枠”だけ（後で日付×人の表に差し替える）
  return (
    <div className="h-full rounded border border-neutral-300 p-2">
      <div className="grid h-full grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="rounded border border-neutral-200 bg-neutral-50 p-1 text-[10px] text-neutral-600"
          >
            cell {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
