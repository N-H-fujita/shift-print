import { modulo } from "./modulo";
import { diffDaysUtc, parseYmdToUtcDate } from "./dateUTC";
import type { ShiftKey } from "./shiftRows";

/**
 * anchorDate を基準にローテindexを返す
 * - anchorDateの日を index=0 とする（運用で合わせる）
 */
export function calcRotationIndexByAnchor(params: {
  targetDate: Date;
  anchorDateYmd: string;
  peopleCount: number;
  offset?: number;
}): number {
  const { targetDate, anchorDateYmd, peopleCount, offset = 0 } = params;
  const anchorDate = parseYmdToUtcDate(anchorDateYmd);

  const targetUtc = new Date(Date.UTC(
    targetDate.getUTCFullYear(),
    targetDate.getUTCMonth(),
    targetDate.getUTCDate()
  ));

  const dayDiff = diffDaysUtc(targetUtc, anchorDate);
  return modulo(dayDiff + offset, peopleCount);
}

/** 1日・1行のメンバー名を返す（絶対基準方式） */
export function pickMemberByAnchor(params: {
  targetDate: Date;
  shiftKey: ShiftKey;
  members: readonly string[];
  anchorDateYmd: string;
  offsetFromTripByKey: Record<ShiftKey, number>;
}): string {
  const { targetDate, shiftKey, members, anchorDateYmd, offsetFromTripByKey } = params;

  const tripIndex = calcRotationIndexByAnchor({
    targetDate,
    anchorDateYmd,
    peopleCount: members.length,
    offset: 0,
  });

  const idx = modulo(tripIndex + offsetFromTripByKey[shiftKey], members.length);
  return members[idx];
}