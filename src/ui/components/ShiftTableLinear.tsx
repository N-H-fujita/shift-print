import React from "react";
import type { ShiftKey, ShiftRow } from "../../core/shiftRows";
import { ShiftCellLinear } from "../components/ShiftCellLinear";
import { pickMember } from "../../core/rotationFacade";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

function getDayOfWeekJa(year: number, monthIndex0: number, day: number) {
  return WEEKDAYS_JA[new Date(year, monthIndex0, day).getDay()];
}

/**
 * 1〜15 / 16〜末日 を「横一列」で並べる表
 * - 左列：会議/早番/遅番/休み
 * - 上段：日付+曜日（ヘッダ）
 * - 本体：各セルに該当メンバー名
 */
export function ShiftTableLinear({
  year,
  monthIndex0,
  startDay,
  endDay,
  members,
  mode,
  anchorDateYmd,
  rows,
  offsetFromTripByKey,
  highlightName,
}: {
  year: number;
  monthIndex0: number;
  startDay: number;
  endDay: number;
  members: readonly string[];
  mode: "temp" | "anchor";
  anchorDateYmd?: string;
  rows: readonly ShiftRow[];
  offsetFromTripByKey: Record<ShiftKey, number>;
  highlightName?: string;
}) {
  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
  const colCount = days.length;

  const getHeaderBgClass = (day: number) => {
    if (!highlightName) return "bg-neutral-100";

    const date = new Date(year, monthIndex0, day);

    let hasMineOnOff = false;
    let hasMineOnWork = false;

    for (const row of rows) {
      const member = pickMember({
        date,
        day,
        shiftKey: row.key,
        members,
        mode,
        anchorDateYmd,
        offsetFromTripByKey,
      });

      if (member !== highlightName) continue;

      if (row.key.startsWith("off")) {
        hasMineOnOff = true;
      } else {
        hasMineOnWork = true;
      }
    }

    if (hasMineOnWork) return "bg-yellow-200";
    if (hasMineOnOff) return "bg-lime-200";
    return "bg-neutral-100";
  };

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
          const dow = getDayOfWeekJa(year, monthIndex0, day);
          const isSun = dow === "日";
          const isSat = dow === "土";
          const headerBgClass = getHeaderBgClass(day);

          return (
            <div
              key={day}
              className={[
                "border-b border-neutral-200 px-0.5 py-0 text-lg leading-none",
                headerBgClass,
              ].join(" ")}
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

        {/* 会議行 */}
        <React.Fragment>
          <div className="border-r border-b border-neutral-200 bg-white px-0.5 py-0 text-xl font-bold text-center leading-none">
            会議
          </div>

          {days.map((day) => {
            const isSat = getDayOfWeekJa(year, monthIndex0, day) === "土";

            return (
              <div
                key={`meeting-${day}`}
                className="border-b border-neutral-200 px-1 py-0 text-lg leading-tight"
              >
                <div className="truncate w-full text-center text-blue-800">
                  {isSat ? "会議" : ""}
                </div>
              </div>
            );
          })}
        </React.Fragment>

        {/* 本体：ローテーション行 */}
        {rows.map((row) => (
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
                year={year}
                monthIndex0={monthIndex0}
                mode={mode}
                anchorDateYmd={anchorDateYmd}
                offsetFromTripByKey={offsetFromTripByKey}
                highlightName={highlightName}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}