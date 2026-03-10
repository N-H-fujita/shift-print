import { SHIFT_ROWS, type ShiftKey, type ShiftRow } from "../core/shiftRows";
import { isShiftDataV1, type ShiftDataV1 } from "../core/shiftData";
import { ShiftTableLinear } from "./components/ShiftTableLinear";

const SHIFT_KEYS = new Set<ShiftKey>(SHIFT_ROWS.map((r) => r.key));

function normalizeShiftRows(data: ShiftDataV1 | null): readonly ShiftRow[] {
  const raw = data?.rows;
  if (!raw || raw.length === 0) return SHIFT_ROWS;

  const parsed: ShiftRow[] = [];

  for (const r of raw) {
    const key = r?.key;
    const label = r?.label;
    const offset = (r as any)?.offsetFromTrip;

    if (typeof key !== "string") continue;
    if(!SHIFT_KEYS.has(key as ShiftKey)) continue; // 未知のキーは無視
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

// readShiftData()はそのままでもOKだが、戻り値の型だけ少し強くする
function readShiftData(): ShiftDataV1 | null {
  const w = window as unknown as { SHIFT_DATA?: unknown };
  const raw = w.SHIFT_DATA;
  return isShiftDataV1(raw) ? raw : null;
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
  // const now = new Date();
  const now = new Date(2026, 5, 1);
  const year = now.getFullYear();
  const monthIndex0 = now.getMonth();
  const daysInMonth = getDaysInMonth(year, monthIndex0);

  const monthLabel = formatMonthLabel(now);
  const printedAt = formatPrintedAt(now);

  const data = readShiftData();
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
