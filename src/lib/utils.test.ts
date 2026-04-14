import { describe, expect, it } from "vitest";

import { cn, initials, scoreToLabel } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("initials", () => {
  it("returns up to two initials", () => {
    expect(initials("Alex Mercer")).toBe("AM");
  });
});

describe("scoreToLabel", () => {
  it("maps scores to labels", () => {
    expect(scoreToLabel(90)).toBe("High");
    expect(scoreToLabel(60)).toBe("Medium");
    expect(scoreToLabel(20)).toBe("Low");
  });
});
