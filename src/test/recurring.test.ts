import { describe, expect, it } from "vitest";
import { addOccurrence, dueOccurrences } from "@/lib/recurring";

describe("recurring scheduling", () => {
  it("calculates one weekly occurrence per week", () => {
    expect(dueOccurrences("2026-04-01", "weekly", undefined, "2026-04-20")).toEqual([
      "2026-04-01",
      "2026-04-08",
      "2026-04-15",
    ]);
  });

  it("moves forward from the last posted date", () => {
    expect(dueOccurrences("2026-04-01", "daily", "2026-04-03", "2026-04-05")).toEqual([
      "2026-04-04",
      "2026-04-05",
    ]);
  });

  it("advances monthly by a single interval", () => {
    expect(addOccurrence("2026-04-15", "monthly")).toBe("2026-05-15");
  });
});