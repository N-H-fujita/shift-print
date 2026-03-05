import type { ShiftKey } from "./shiftRows";

export type ShiftDataV1 = {
  version: 1;

  highlightName?: string;

  mode?: "temp" | "anchor";

  /**
   * 基準日（この日をローテ0番として扱う）
   * 例: "2026-01-01"
   */
  anchorDate?: string;

  /**
   * ローテ対象メンバー（並び順がそのままローテ順）
   */
  members?: string[];

  /**
   * 行定義（将来2行増えてもここに足すだけ）
   * - key: UI側の識別子
   * - label: 表示名
   * - offsetFromTrip: trip基準オフセット（今はダミー方式と同じ概念でOK）
   */
  rows?: Array<{
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

/**
 * type guard（壊れてても落とさない用）
 *
 * 方針：
 * - version=1 だけは必須
 * - それ以外は「存在するなら型を確認」する（無ければOK）
 *
 * 理由：
 * - data.js は段階的に項目が増える
 * - mode/anchorDateだけで挙動確認したいケースがある
 */
export function isShiftDataV1(x: unknown): x is ShiftDataV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as any;

  if (o.version !== 1) return false;

  // modeが存在するなら値をチェック
  if (o.mode !== undefined && o.mode !== "temp" && o.mode !== "anchor") return false;

  // anchorDateが存在するなら文字列かチェック
  if (o.anchorDate !== undefined && typeof o.anchorDate !== "string") return false;

  // membersが存在するなら配列かチェック
  if (o.members !== undefined && !Array.isArray(o.members)) return false;

  // rowsが存在するなら配列かチェック
  if (o.rows !== undefined && !Array.isArray(o.rows)) return false;

  // hightlightNameが存在するなら文字列かチェック
  if (o.highlightName !== undefined && typeof o.highlightName !== "string") return false;

  return true;
}