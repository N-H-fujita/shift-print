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

export type ValidationResult = {
  errors: string[];
  warnings: string[];
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

  // highlightNameが存在するなら文字列かチェック
  if (o.highlightName !== undefined && typeof o.highlightName !== "string") return false;

  return true;
}

const KNOWN_SHIFT_KEYS = new Set<string>([
  "early",
  "late",
  "trip",
  "off1",
  "off2",
  "off3",
]);

function isYmdFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateShiftData(data: ShiftDataV1 | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data) {
    errors.push("SHIFT_DATA の形式が不正です。data.js を確認してください。");
    return { errors, warnings };
  }

  // members
  if (!data.members || data.members.length === 0) {
    errors.push("members が設定されていません。1名以上設定してください。");
  } else {
    const normalizedMembers = data.members
      .filter((name) => typeof name === "string")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    if (normalizedMembers.length === 0) {
      errors.push("members が空です。1名以上設定してください。");
    }

    if (normalizedMembers.length !== data.members.length) {
      warnings.push("members に空文字または不正な値が含まれています。");
    }

    const memberSet = new Set(normalizedMembers);
    if (memberSet.size !== normalizedMembers.length) {
      warnings.push("members に重複があります。");
    }

    if (
      data.highlightName &&
      !normalizedMembers.includes(data.highlightName.trim())
    ) {
      warnings.push("highlightName が members に存在しません。");
    }
  }

  // mode / anchorDate
  const mode = data.mode ?? "temp";
  if (mode === "anchor") {
    if (!data.anchorDate) {
      errors.push('mode が "anchor" のため、anchorDate が必要です。');
    } else if (!isYmdFormat(data.anchorDate)) {
      errors.push('anchorDate は "YYYY-MM-DD" 形式で指定してください。');
    }
  } else if (data.anchorDate && !isYmdFormat(data.anchorDate)) {
    warnings.push('anchorDate は "YYYY-MM-DD" 形式推奨です。');
  }

  // rows
  if (data.rows && data.rows.length > 0) {
    let validRowCount = 0;
    let invalidStructureFound = false;
    let unknownKeyFound = false;

    const keyList: string[] = [];
    const offsetList: number[] = [];

    for (const row of data.rows) {
      const key = row?.key;
      const label = row?.label;
      const offset = row?.offsetFromTrip;

      const hasValidStructure =
        typeof key === "string" &&
        typeof label === "string" &&
        typeof offset === "number" &&
        Number.isFinite(offset);

      if (!hasValidStructure) {
        invalidStructureFound = true;
        continue;
      }

      validRowCount += 1;
      keyList.push(key);
      offsetList.push(offset);

      if (!KNOWN_SHIFT_KEYS.has(key)) {
        unknownKeyFound = true;
      }

      if (label.trim().length === 0) {
        warnings.push(`rows の label が空です: key="${key}"`);
      }
    }

    if (invalidStructureFound) {
      warnings.push("rows に不正な定義があります。一部の行は無視されます。");
    }

    if (unknownKeyFound) {
      warnings.push("rows に未対応の key があります。現在のUIでは無視されます。");
    }

    if (validRowCount === 0) {
      errors.push("rows がすべて不正です。表示に使用できる行定義がありません。");
    }

    const uniqueKeys = new Set(keyList);
    if (uniqueKeys.size !== keyList.length) {
      warnings.push("rows に key の重複があります。");
    }

    const uniqueOffsets = new Set(offsetList);
    if (uniqueOffsets.size !== offsetList.length) {
      warnings.push("rows に offsetFromTrip の重複があります。");
    }

    if (!keyList.includes("trip")) {
      warnings.push('rows に "trip" がありません。意図したローテーションにならない可能性があります。');
    }
  }

  return { errors, warnings };
}