import React from "react";
import { SHIFT_ROWS, type ShiftKey } from "../core/shiftRows";
import { pickMemberByDayOffset } from "../core/rotationTemp";
import { isShiftDataV1, type ShiftDataV1 } from "../core/shiftData";

// readShiftData()はそのままでもOKだが、戻り値の型だけ少し強くする
function readShiftData(): ShiftDataV1 | null {
  const w = window as unknown as { SHIFT_DATA?: unknown };
  const raw = w.SHIFT_DATA;
  return isShiftDataV1(raw) ? raw : null;
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

// ===== UI確認用のダミー =====
const FALLBACK_MEMBERS = [
  "田中","佐藤","鈴木","高橋","伊藤","渡辺","山本","中村","小林","加藤","吉田"
] as const;

// ==========================

export function PrintPage() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex0 = now.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex0);

  const monthLabel = formatMonthLabel(now);
  const printedAt = formatPrintedAt(now);
  const data = readShiftData();

  const members = data?.members?.length ? data.members : [...FALLBACK_MEMBERS];

  const topStart = 1;
  const topEnd = Math.min(15, daysInMonth);

  const bottomStart = Math.min(16, daysInMonth + 1);
  const bottomEnd = daysInMonth;

  return (
    <main className="mx-auto w-fit">
      {/* “用紙” */}
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
        <div className="mt-2 grid flex-1 grid-rows-2 gap-1 overflow-hidden">
          <section className="panel min-h-0">
            <ShiftTableLinear
              year={year}
              monthIndex0={monthIndex0}
              startDay={topStart}
              endDay={topEnd}
              members={members}
            />
          </section>

          <section className="panel min-h-0">
            {bottomStart <= bottomEnd ? (
              <ShiftTableLinear
                year={year}
                monthIndex0={monthIndex0}
                startDay={bottomStart}
                endDay={bottomEnd}
                members={members}
              />
            ) : (
              <div className="h-full rounded border border-neutral-300 p-2 text-sm text-neutral-600">
                （この月は下段がありません）
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

/**
 * 1〜15 / 16〜末日 を「横一列」で並べる表
 * - 左列：早番/遅番/休み（固定）
 * - 上段：日付+曜日（ヘッダ）
 * - 本体：各セルに該当メンバー名（いまはダミー）
 */
function ShiftTableLinear({
  year,
  monthIndex0,
  startDay,
  endDay,
  members,
}: {
  year: number;
  monthIndex0: number;
  startDay: number;
  endDay: number;
  members: readonly string[];
}) {
  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
  const colCount = days.length;

  return (
    <div className="h-full rounded border border-neutral-300 p-0">
      {/* 左見出し + 日付列（colCount） */}
      <div
        className="grid h-full border border-neutral-200"
        style={{ gridTemplateColumns: `18mm repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {/* 左上（空） */}
        <div className="border-b border-r border-neutral-200 bg-neutral-100" />

        {/* 日付ヘッダー */}
        {days.map((day) => {
          const dow = WEEKDAYS_JA[new Date(year, monthIndex0, day).getDay()];
          const isSun = dow === "日";
          const isSat = dow === "土";

          return (
            <div
              key={day}
              className="border-b border-neutral-200 bg-neutral-100 px-0.5 py-0 text-lg leading-none"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="font-semibold leading-none">{day}</span>
                <span className={isSun ? "text-red-600" : isSat ? "text-blue-600" : "text-neutral-600"}>
                  {dow}
                </span>
              </div>
            </div>
          );
        })}

        {/* 本体：早番/遅番/休み の3行 */}
        {SHIFT_ROWS.map((row) => (
          <React.Fragment key={row.key}>
            {/* 左：行見出し */}
            <div className="border-r border-b border-neutral-200 bg-white px-0.5 py-0 text-xl font-bold text-center leading-none">
              {row.label}
            </div>

            {/* 右：日付セル */}
            {days.map((day) => (
              <ShiftCellLinear
                key={`${row.key}-${day}`}
                day={day}
                shiftKey={row.key}
                members={members}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ShiftCellLinear({
  day,
  shiftKey,
  members
}: {
  day: number;
  shiftKey: ShiftKey;
  members: readonly string[];
}) {
  const picked = pickMemberByDayOffset({
    day,
    shiftKey,
    members,
  });

  const isOff = shiftKey.startsWith("off");
  const isTrip = shiftKey === "trip";

  return (
    <div
      className={[
        "border-b border-neutral-200 px-1 py-0 text-lg font-medium leading-tight",
        isTrip ? "bg-blue-50" : isOff ? "bg-neutral-50" : "bg-white",
      ].join(" ")}
    >
      <div className="truncate w-full text-center">{picked}</div>
    </div>
  );
}
