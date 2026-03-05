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
  offsetFromTripByKey?: Record<ShiftKey, number>;
}): string {
  const { mode, date, day, shiftKey, members, anchorDateYmd, offsetFromTripByKey } = params;

  if (mode === "anchor") {
    if (!anchorDateYmd) return "";

    const offsetMap =
      offsetFromTripByKey ??
      (Object.fromEntries(
        SHIFT_ROWS.map((row) => [row.key, row.offsetFromTrip])
      ) as Record<ShiftKey, number>);

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