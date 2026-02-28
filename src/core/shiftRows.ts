// 「その日に出張する人」を基準にしたオフセット（ダミー）
// trip: day
// off1: tripの翌日 → day-1 のtrip
// off2: day-2 のtrip
// off3: day-3 のtrip
// late: tripの3日前 → day+3 のtrip
// early: lateの3日前 → day+6 のtrip
export const SHIFT_ROWS = [
  { key: "early", label: "早番", offsetFromTrip: +6 },
  { key: "late", label: "遅番", offsetFromTrip: +3 },
  { key: "trip", label: "出張", offsetFromTrip: 0 },
  { key: "off1", label: "休み①", offsetFromTrip: -1 },
  { key: "off2", label: "休み②", offsetFromTrip: -2 },
  { key: "off3", label: "休み③", offsetFromTrip: -3 },
] as const;

export type ShiftKey = (typeof SHIFT_ROWS)[number]["key"];
export type ShiftRow = (typeof SHIFT_ROWS)[number];