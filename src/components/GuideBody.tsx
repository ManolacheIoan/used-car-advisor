import { IS_SHOWCASE } from "@/lib/mode";
import type { Guide } from "@/lib/guides";
import { renderMarkdown } from "@/lib/guides";

/** Rendered Markdown of our own content (trusted, written in the repo). */
export function GuideBody({ guide }: { guide: Guide }) {
  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.body) }}
    />
  );
}

export function GuideMeta({ guide }: { guide: Guide }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="border-line text-muted rounded-full border px-2 py-0.5">
        ghid orientativ
      </span>
      <span className="text-muted">
        revizuit la <time dateTime={guide.reviewed}>{guide.reviewed}</time>
      </span>
      {guide.status === "draft" && !IS_SHOWCASE && (
        <span className="border-accent text-accent-text rounded-full border px-2 py-0.5 font-semibold">
          CIORNĂ (vizibilă doar în DEMO)
        </span>
      )}
    </div>
  );
}
