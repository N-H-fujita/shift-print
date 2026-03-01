/** "YYYY-MM-DD" をUTC日付として Date を作る（ローカルTZのズレ回避） */
export function parseYmdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Date同士のUTC日単位差分（a - b） */
export function diffDaysUtc(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((utcA - utcB) / msPerDay);
}