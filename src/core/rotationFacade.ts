import { pickMemberByDayOffset } from "./rotationTemp";
import { pickMemberByAnchor } from "./rotationAnchor";
import { SHIFT_ROWS, type ShiftKey } from "./shiftRows";

type Mode = "temp" | "anchor";

export function pickMember(params: {
  mode: Mode;
  date: Date;
  day: number;
  shiftKey: ShiftKey;
  members: readonly string[];
  anchorDateYmd?: string; // anchorモードのとき必須
}): string {
  const { mode, date, day, shiftKey, members, anchorDateYmd } = params;

  if (mode === "anchor") {
    if (!anchorDateYmd) return "";

    const offsetMap = Object.fromEntries(
      SHIFT_ROWS.map((r) => [r.key, r.offsetFromTrip])
    ) as Record<ShiftKey, number>;

    return pickMemberByAnchor({
      targetDate: date,
      shiftKey,
      members,
      anchorDateYmd,
      offsetFromTripByKey: offsetMap,
    });
  }

  return pickMemberByDayOffset({
    day,
    shiftKey,
    members,
  });
}