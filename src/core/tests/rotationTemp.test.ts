import { describe, it, expect } from "vitest";
import { pickMemberByDayOffset } from "../rotationTemp";

describe("pickMemberByDayOffset", () => {

  const members = ["Tom", "Bob", "Alice"];

  it("trip が日付でローテーションする", () => {
    expect(
      pickMemberByDayOffset({ day: 0, shiftKey: "trip", members })
    ).toBe("Tom");

    expect(
      pickMemberByDayOffset({ day: 1, shiftKey: "trip", members })
    ).toBe("Bob");

    expect(
      pickMemberByDayOffset({ day: 2, shiftKey: "trip", members })
    ).toBe("Alice");

    expect(
      pickMemberByDayOffset({ day: 3, shiftKey: "trip", members })
    ).toBe("Tom");
  });

  it("late は trip の +3 日ローテーション", () => {
    const result = pickMemberByDayOffset({ day: 0, shiftKey: "late", members });
    expect(result).toBe("Tom");
  });

  it("off1 は trip の -1 日ローテーション", () => {
    const result = pickMemberByDayOffset({ day: 0, shiftKey: "off1", members });
    expect(result).toBe("Alice");
  });

});