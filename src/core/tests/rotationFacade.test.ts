import { describe, it, expect } from "vitest";
import { pickMember } from "../rotationFacade";

describe("pickMember", () => {
  const members = ["Tom", "Bob", "Alice"] as const;

  const offsetFromTripByKey = {
    early: 6,
    late: 3,
    trip: 0,
    off1: -1,
    off2: -2,
    off3: -3,
  } as const;

  it("temp モードでは day ベースでメンバーを返す", () => {
    const result = pickMember({
      mode: "temp",
      date: new Date("2026-01-01T00:00:00Z"),
      day: 0,
      shiftKey: "trip",
      members,
    });

    expect(result).toBe("Tom");
  });

  it("temp モードでは shiftKey の offset を使ってメンバーを返す", () => {
    const result = pickMember({
      mode: "temp",
      date: new Date("2026-01-01T00:00:00Z"),
      day: 0,
      shiftKey: "off1",
      members,
    });

    expect(result).toBe("Alice");
  });

  it("anchor モードでは anchorDate を基準にメンバーを返す", () => {
    const result = pickMember({
      mode: "anchor",
      date: new Date("2026-01-02T00:00:00Z"),
      day: 999, // anchor モードでは使われない
      shiftKey: "trip",
      members,
      anchorDateYmd: "2026-01-01",
      offsetFromTripByKey,
    });

    expect(result).toBe("Bob");
  });

  it("anchor モードで anchorDateYmd がない場合は空文字を返す", () => {
    const result = pickMember({
      mode: "anchor",
      date: new Date("2026-01-01T00:00:00Z"),
      day: 0,
      shiftKey: "trip",
      members,
    });

    expect(result).toBe("");
  });

  it("anchor モードで offsetFromTripByKey 未指定時はデフォルト設定を使う", () => {
    const result = pickMember({
      mode: "anchor",
      date: new Date("2026-01-01T00:00:00Z"),
      day: 0,
      shiftKey: "off1",
      members,
      anchorDateYmd: "2026-01-01",
    });

    expect(result).toBe("Alice");
  });
});