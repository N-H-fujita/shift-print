import { describe, it, expect } from "vitest";
import {
  calcRotationIndexByAnchor,
  pickMemberByAnchor,
} from "../rotationAnchor";

describe("calcRotationIndexByAnchor", () => {
  it("anchorDate 当日は index=0 になる", () => {
    const result = calcRotationIndexByAnchor({
      targetDate: new Date("2026-01-01T00:00:00Z"),
      anchorDateYmd: "2026-01-01",
      peopleCount: 3,
    });

    expect(result).toBe(0);
  });

  it("anchorDate の翌日は index が 1 進む", () => {
    const result = calcRotationIndexByAnchor({
      targetDate: new Date("2026-01-02T00:00:00Z"),
      anchorDateYmd: "2026-01-01",
      peopleCount: 3,
    });

    expect(result).toBe(1);
  });

  it("anchorDate の前日でも循環して index を返す", () => {
    const result = calcRotationIndexByAnchor({
      targetDate: new Date("2025-12-31T00:00:00Z"),
      anchorDateYmd: "2026-01-01",
      peopleCount: 3,
    });

    expect(result).toBe(2);
  });

  it("offset を加味して index を返す", () => {
    const result = calcRotationIndexByAnchor({
      targetDate: new Date("2026-01-01T00:00:00Z"),
      anchorDateYmd: "2026-01-01",
      peopleCount: 3,
      offset: 2,
    });

    expect(result).toBe(2);
  });

  it("月をまたいでも正しく index を返す", () => {
    const result = calcRotationIndexByAnchor({
      targetDate: new Date("2026-02-01T00:00:00Z"),
      anchorDateYmd: "2026-01-31",
      peopleCount: 3,
    });

    expect(result).toBe(1);
  });
});

describe("pickMemberByAnchor", () => {
  const members = ["Tom", "Bob", "Alice"] as const;

  const offsetFromTripByKey = {
    early: 6,
    late: 3,
    trip: 0,
    off1: -1,
    off2: -2,
    off3: -3,
  } as const;

  it("anchorDate 当日の trip は先頭メンバーになる", () => {
    const result = pickMemberByAnchor({
      targetDate: new Date("2026-01-01T00:00:00Z"),
      shiftKey: "trip",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Tom");
  });

  it("anchorDate 翌日の trip は次のメンバーになる", () => {
    const result = pickMemberByAnchor({
      targetDate: new Date("2026-01-02T00:00:00Z"),
      shiftKey: "trip",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Bob");
  });

  it("late は trip の +3 オフセットで選ばれる", () => {
    const result = pickMemberByAnchor({
      targetDate: new Date("2026-01-01T00:00:00Z"),
      shiftKey: "late",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Tom");
  });

  it("off1 は trip の -1 オフセットで選ばれる", () => {
    const result = pickMemberByAnchor({
      targetDate: new Date("2026-01-01T00:00:00Z"),
      shiftKey: "off1",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Alice");
  });

  it("anchorDate 前日でも正しく循環する", () => {
    const result = pickMemberByAnchor({
      targetDate: new Date("2025-12-31T00:00:00Z"),
      shiftKey: "trip",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Alice");
  });
});
