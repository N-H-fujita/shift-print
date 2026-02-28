import { modulo } from "./modulo";
import type { ShiftKey } from "./shiftRows";

export function pickMemberByDayOffset(params: {
  day: number;
  shiftKey: ShiftKey;
  members: readonly string[];
}): string {
  const { day, shiftKey, members } = params;
  const n = members.length;

  // 「その日に出張する人」を基準にしたオフセット（ダミー）
  // trip: day
  // off1: tripの翌日 → day-1 のtrip
  // off2: day-2 のtrip
  // off3: day-3 のtrip
  // late: tripの3日前 → day+3 のtrip
  // early: lateの3日前 → day+6 のtrip
  const offsetByKey: Record<ShiftKey, number> = {
    trip: 0,
    off1: -1,
    off2: -2,
    off3: -3,
    late: +3,
    early: +6,
  };

  return members[modulo(day + offsetByKey[shiftKey], n)];
}