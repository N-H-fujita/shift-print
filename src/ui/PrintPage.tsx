import React from "react";

type ShiftData = {
  version?: number;
  note?: string;
};

function readShiftData(): ShiftData | null {
  const w = window as unknown as { SHIFT_DATA?: unknown };
  if (!("SHIFT_DATA" in w)) return null;
  return (w.SHIFT_DATA as ShiftData) ?? null;
}

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

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

function getDaysInMonth(year: number, monthIndex0: number): number {
  // monthIndex0: 0=Jan
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function createDate(year: number, monthIndex0: number, day: number): Date {
  return new Date(year, monthIndex0, day);
}

type DayCellModel =
  | { kind: "blank" }
  | { kind: "day"; date: Date; day: number; weekday: (typeof WEEKDAYS_JA)[number] };

function buildMonthGrid(year: number, monthIndex0: number, startDay: number, endDay: number): DayCellModel[] {
  const startDate = createDate(year, monthIndex0, startDay);
  const startDow = startDate.getDay(); // 0..6

  const cells: DayCellModel[] = [];

  // 先頭の曜日に合わせて空セル
  for (let i = 0; i < startDow; i++) cells.push({ kind: "blank" });

  for (let day = startDay; day <= endDay; day++) {
    const d = createDate(year, monthIndex0, day);
    cells.push({
      kind: "day",
      date: d,
      day,
      weekday: WEEKDAYS_JA[d.getDay()],
    });
  }

  // 末尾も7の倍数に揃える（見た目の整列用）
  while (cells.length % 7 !== 0) cells.push({ kind: "blank" });

  return cells;
}

export function PrintPage() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex0 = now.getMonth(); // 0..11
  const daysInMonth = getDaysInMonth(year, monthIndex0);

  const monthLabel = formatMonthLabel(now);
  const printedAt = formatPrintedAt(now);
  const data = readShiftData();

  const topStart = 1;
  const topEnd = Math.min(15, daysInMonth);
  const bottomStart = Math.min(16, daysInMonth + 1);
  const bottomEnd = daysInMonth;

  const topCells = buildMonthGrid(year, monthIndex0, topStart, topEnd);
  const bottomCells =
    bottomStart <= bottomEnd ? buildMonthGrid(year, monthIndex0, bottomStart, bottomEnd) : [];

  return (
    <main className="mx-auto w-fit">
      <section className="sheet flex flex-col bg-white text-black shadow print:shadow-none">
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
        <div className="mt-3 grid grid-rows-2 gap-3">
          <section className="panel">
            <PanelTitle>上段（1〜15日）</PanelTitle>
            <CalendarGrid cells={topCells} />
          </section>

          <section className="panel">
            <PanelTitle>下段（16日〜月末）</PanelTitle>
            <CalendarGrid cells={bottomCells} />
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
      <span className="text-[11px] text-neutral-500">（月日数に自動対応）</span>
    </div>
  );
}

function CalendarGrid({ cells }: { cells: DayCellModel[] }) {
  return (
    <div className="h-full rounded border border-neutral-300 p-2">
      <div className="grid h-full grid-cols-7 gap-1">
        {cells.map((cell, idx) =>
          cell.kind === "blank" ? (
            <div key={idx} className="rounded border border-transparent p-1" />
          ) : (
            <DayCell key={idx} day={cell.day} weekday={cell.weekday} />
          )
        )}
      </div>
    </div>
  );
}

function DayCell({ day, weekday }: { day: number; weekday: string }) {
  const isSunday = weekday === "日";
  const isSaturday = weekday === "土";

  return (
    <div className="flex h-full flex-col rounded border border-neutral-200 bg-neutral-50 p-1 text-[9px] leading-tight text-neutral-700">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{day}</span>
        <span className={isSunday ? "text-red-600" : isSaturday ? "text-blue-600" : ""}>
          {weekday}
        </span>
      </div>
      {/* ここに後で「人×シフト」を入れる想定 */}
      <div className="mt-1 flex-1 rounded border border-neutral-200 bg-white" />
    </div>
  );
}
