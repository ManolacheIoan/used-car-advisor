import { describe, expect, it } from "vitest";
import { robotsMatch } from "@/lib/robots";

describe("robotsMatch", () => {
  it.each([
    ["/w/", "/w/index.php?title=X&oldid=1", true],
    ["/w/", "/wiki/X", false],
    ["/*///*", "/rund-ums-fahrzeug/autokatalog/x/", false],
    ["/*///*", "/a///b", true],
    ["/*.ashx$", "/a.ashx", true],
    ["/*.ashx$", "/a.ashx?x=1", false],
    ["/sparql", "/sparql?query=x", true],
  ])("%s vs %s → %s", (rule, path, expected) => {
    expect(robotsMatch(rule, path)).toBe(expected);
  });
});
