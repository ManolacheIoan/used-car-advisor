import { describe, expect, it } from "vitest";
import { OFFICIAL_LINKS } from "@/config/officialLinks";
import { allGuides, parseGuide, visibleGuides } from "@/lib/guides";

const OFFICIAL = new Set(
  Object.values(OFFICIAL_LINKS).map((l) => new URL(l.url).host),
);

describe("guides content", () => {
  const guides = allGuides();

  it("has at least the planned guides, glossary and FAQ", () => {
    expect(
      guides.filter((g) => g.category === "ghid").length,
    ).toBeGreaterThanOrEqual(10);
    expect(guides.some((g) => g.slug === "glosar")).toBe(true);
    expect(guides.some((g) => g.slug === "intrebari-frecvente")).toBe(true);
  });

  it("every guide has a valid reviewed date and status", () => {
    for (const g of guides) {
      expect(g.reviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["draft", "published"]).toContain(g.status);
    }
  });

  it("links only to our own pages or official institutions", () => {
    for (const g of guides)
      for (const [, href] of g.body.matchAll(/\]\((https?:\/\/[^)]+)\)/g))
        expect(OFFICIAL.has(new URL(href).host), `${g.slug}: ${href}`).toBe(
          true,
        );
  });

  it("contains no listing-site data", () => {
    for (const g of guides)
      expect(g.body.toLowerCase()).not.toContain("autovit");
  });

  it("public builds hide drafts", () => {
    // Unit tests run in public mode.
    expect(visibleGuides().every((g) => g.status === "published")).toBe(true);
  });
});

describe("parseGuide", () => {
  it("rejects missing front matter fields and invalid status", () => {
    expect(() => parseGuide("x", "no front matter")).toThrow(/front matter/);
    expect(() => parseGuide("x", "---\ntitle: A\n---\nbody")).toThrow(
      /description/,
    );
    expect(() =>
      parseGuide(
        "x",
        "---\ntitle: A\ndescription: B\nstatus: live\nreviewed: 2026-10-16\n---\nbody",
      ),
    ).toThrow(/status/);
  });

  it("keeps colons inside values", () => {
    const g = parseGuide(
      "x",
      "---\ntitle: A: B\ndescription: C\nstatus: draft\nreviewed: 2026-10-16\n---\nbody",
    );
    expect(g.title).toBe("A: B");
  });
});
