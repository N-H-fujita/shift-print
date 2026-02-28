export const SHIFT_ROWS = [
  { key: "early", label: "早番" },
  { key: "late", label: "遅番" },
  { key: "trip", label: "出張" },
  { key: "off1", label: "休み①" },
  { key: "off2", label: "休み②" },
  { key: "off3", label: "休み③" },
] as const;

export type ShiftKey = (typeof SHIFT_ROWS)[number]["key"];