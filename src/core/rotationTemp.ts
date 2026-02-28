import { modulo } from "./modulo";
import { SHIFT_ROWS, type ShiftKey } from "./shiftRows";

export function pickMemberByDayOffset(params: {
  day: number;
  shiftKey: ShiftKey;
  members: readonly string[];
}): string {
  const { day, shiftKey, members } = params;
  const n = members.length;

  const row = SHIFT_ROWS.find((r) => r.key === shiftKey);
  if (!row) return ""; // 型的には来ない想定だが念のため

  return members[modulo(day + row.offsetFromTrip, n)];
}