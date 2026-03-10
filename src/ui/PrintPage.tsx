import { useState } from "react";
import { SHIFT_ROWS, type ShiftKey, type ShiftRow } from "../core/shiftRows";
import { isShiftDataV1, type ShiftDataV1 } from "../core/shiftData";
import { ShiftTableLinear } from "./components/ShiftTableLinear";

const SHIFT_KEYS = new Set<ShiftKey>(SHIFT_ROWS.map((r) => r.key));

const MONTH_OPTIONS = [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11", "12"
] as const;

// ===== UI確認用のダミー =====
const FALLBACK_MEMBERS = [
  "田中","佐藤","鈴木","高橋","伊藤","渡辺","山本","中村","小林","加藤","吉田"
] as const;

// ==========================

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

// readShiftData()はそのままでもOKだが、戻り値の型だけ少し強くする
function readShiftData(): ShiftDataV1 | null {
  const w = window as unknown as { SHIFT_DATA?: unknown };
  const raw = w.SHIFT_DATA;
  return isShiftDataV1(raw) ? raw : null;
}

export function PrintPage() {
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonthIndex0, setSelectedMonthIndex0] = useState(now.getMonth());

  const year = selectedYear;
  const monthIndex0 = selectedMonthIndex0;
  const daysInMonth = getDaysInMonth(year, monthIndex0);

  const displayDate = new Date(year, monthIndex0, 1);
  const monthLabel = formatMonthLabel(displayDate);
  const printedAt = formatPrintedAt(new Date());

  const data = readShiftData();
  const warnings = collectWarnings(data);

  const mode = data?.mode ?? "temp";
  const anchorDateYmd = data?.anchorDate;
  const members = data?.members?.length ? data.members : [...FALLBACK_MEMBERS];
  const highlightName = data?.highlightName;

  const rows = normalizeShiftRows(data);
  const offsetFromTripByKey = buildOffsetMap(rows);

  const topStart = 1;
  const topEnd = Math.min(15, daysInMonth);

  const bottomStart = Math.min(16, daysInMonth + 1);
  const bottomEnd = daysInMonth;

  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

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
          </div>
        </header>

        {/* 年月切り替えUI（印刷時は非表示） */}
        <div className="mt-2 flex items-end gap-3 print:hidden">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-neutral-700">年</span>
            <select
              className="rounded border border-neutral-300 bg-white px-2 py-1"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((optionYear) => (
                <option key={optionYear} value={optionYear}>
                  {optionYear}年
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 text-neutral-700">月</span>
            <select
              className="rounded border border-neutral-300 bg-white px-2 py-1"
              value={selectedMonthIndex0}
              onChange={(e) => setSelectedMonthIndex0(Number(e.target.value))}
            >
              {MONTH_OPTIONS.map((month, index) => (
                <option key={month} value={index}>
                  {month}月
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 警告表示 */}
        {warnings.length > 0 && (
          <div className="mt-2 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 print:hidden">
            <div className="font-bold">設定エラー / 警告</div>
            <ul className="mt-1 list-disc pl-5">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 2段（上段 / 下段） */}
        <div className="mt-2 grid flex-1 grid-rows-2 gap-1 overflow-hidden">
          <section className="panel min-h-0">
            <ShiftTableLinear
              year={year}
              monthIndex0={monthIndex0}
              startDay={topStart}
              endDay={topEnd}
              members={members}
              mode={mode}
              anchorDateYmd={anchorDateYmd}
              rows={rows}
              offsetFromTripByKey={offsetFromTripByKey}
              highlightName={highlightName}
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
                mode={mode}
                anchorDateYmd={anchorDateYmd}
                rows={rows}
                offsetFromTripByKey={offsetFromTripByKey}
                highlightName={highlightName}
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

function normalizeShiftRows(data: ShiftDataV1 | null): readonly ShiftRow[] {
  const raw = data?.rows;
  if (!raw || raw.length === 0) return SHIFT_ROWS;

  const parsed: ShiftRow[] = [];

  for (const r of raw) {
    const key = r?.key;
    const label = r?.label;
    const offset = (r as any)?.offsetFromTrip;

    if (typeof key !== "string") continue;
    if (!SHIFT_KEYS.has(key as ShiftKey)) continue; // 未知のキーは無視
    if (typeof label !== "string") continue;
    if (typeof offset !== "number" || !Number.isFinite(offset)) continue;

    parsed.push({ key: key as ShiftKey, label, offsetFromTrip: offset } as ShiftRow);
  }

  // 全滅したらフォールバック
  return parsed.length ? (parsed as readonly ShiftRow[]) : SHIFT_ROWS;
}

function buildOffsetMap(rows: readonly ShiftRow[]): Record<ShiftKey, number> {
  return Object.fromEntries(rows.map((r) => [r.key, r.offsetFromTrip])) as Record<ShiftKey, number>;
}

function collectWarnings(data: ShiftDataV1 | null): string[] {
  const warnings: string[] = [];

  if (!data) {
    warnings.push("SHIFT_DATA の形式が不正です。data.js を確認してください。");
    return warnings;
  }

  if (!data.members || data.members.length === 0) {
    warnings.push("members が設定されていません。");
  }

  if (data.mode === "anchor" && !data.anchorDate) {
    warnings.push('mode が "anchor" のため、anchorDate が必要です。');
  }

  if (data.rows) {
    const invalidRows = data.rows.filter((row) => {
      if (typeof row.key !== "string") return true;
      if (typeof row.label !== "string") return true;
      if (typeof row.offsetFromTrip !== "number" || !Number.isFinite(row.offsetFromTrip)) return true;
      return false;
    });

    if (invalidRows.length > 0) {
      warnings.push("rows に不正な定義があります。一部または全部が無視される可能性があります。");
    }
  }

  return warnings;
}
