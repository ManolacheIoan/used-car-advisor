/**
 * Guides: Markdown files in content/ghiduri/ with front matter. Read at build time only (server components).
 * Every guide is "ghid orientativ"; `status: draft` guides are excluded from public builds (shown only in demo).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { IS_DEMO } from "./mode";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  status: "draft" | "published";
  reviewed: string;
  category: "ghid" | "glosar" | "pagina";
  order: number;
  body: string;
}

const DIR = path.join(process.cwd(), "content", "ghiduri");

/** Minimal front matter parser: `key: value` lines between --- markers. */
export function parseGuide(slug: string, text: string): Guide {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${slug}: missing front matter`);
  const meta = Object.fromEntries(
    m[1].split("\n").map((l) => {
      const i = l.indexOf(":");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^"|"$/g, ""),
      ];
    }),
  );
  for (const k of ["title", "description", "status", "reviewed"])
    if (!meta[k]) throw new Error(`${slug}: missing front matter field "${k}"`);
  if (meta.status !== "draft" && meta.status !== "published")
    throw new Error(`${slug}: status must be draft|published`);
  return {
    slug,
    title: meta.title,
    description: meta.description,
    status: meta.status,
    reviewed: meta.reviewed,
    category: (meta.category as Guide["category"]) || "ghid",
    order: Number(meta.order ?? 100),
    body: m[2],
  };
}

export function allGuides(): Guide[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  return files
    .map((f) =>
      parseGuide(
        f.replace(/\.md$/, ""),
        readFileSync(path.join(DIR, f), "utf8"),
      ),
    )
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "ro"));
}

/** Guides visible in this build: published ones, plus drafts only in demo mode. */
export function visibleGuides(category?: Guide["category"]): Guide[] {
  return allGuides().filter(
    (g) =>
      (IS_DEMO || g.status === "published") &&
      (!category || g.category === category),
  );
}

/** Markdown → HTML. Task-list checkboxes get a <label> (accessible) and stay usable on screen and in print. */
export const renderMarkdown = (md: string) =>
  (marked.parse(md, { async: false }) as string).replace(
    /<li><input (?:disabled="" )?type="checkbox"(?: disabled="")?>\s*([\s\S]*?)<\/li>/g,
    '<li><label><input type="checkbox"> $1</label></li>',
  );

/** "## Question" + following paragraph(s) → FAQ pairs (plain text, links reduced to their label). */
export function faqPairs(md: string): { q: string; a: string }[] {
  return md
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [q, ...rest] = block.split("\n");
      const a = rest
        .join(" ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
      return { q: q.trim(), a };
    })
    .filter((x) => x.q && x.a);
}
