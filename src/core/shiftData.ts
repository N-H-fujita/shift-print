import type { ShiftKey } from "./shiftRows";

export type ShiftDataV1 = {
  version: 1;

  /**
   * 基準日（この日をローテ0番として扱う）
   * 例: "2026-01-01"
   */
  anchorDate: string;

  /**
   * ローテ対象メンバー（並び順がそのままローテ順）
   */
  members: string[];

  /**
   * 行定義（将来2行増えてもここに足すだけ）
   * - key: UI側の識別子
   * - label: 表示名
   * - offsetFromTrip: trip基準オフセット（今はダミー方式と同じ概念でOK）
   */
  rows: Array<{
    key: ShiftKey | string; // 将来行追加時のため string を許可（UI側でunknown扱いにしてもOK）
    label: string;
    offsetFromTrip: number;
  }>;

  note?: string;

  /**
   * 例外（将来用：特定日に特定行だけ固定したい等）
   * 今は設計だけ置く（未使用）
   */
  overrides?: Array<{
    date: string;     // "YYYY-MM-DD"
    rowKey: string;   // "trip" etc
    member: string;   // "田中" etc
  }>;
};

/** type guard（window.SHIFT_DATAが壊れてても落ちない用） */
export function isShiftDataV1(x: unknown): x is ShiftDataV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as any;
  return o.version === 1 && typeof o.anchorDate === "string" && Array.isArray(o.members) && Array.isArray(o.rows);
}