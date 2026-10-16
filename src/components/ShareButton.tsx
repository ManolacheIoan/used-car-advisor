"use client";

import { useState } from "react";

/** Copies the current URL (criteria and cost assumptions are encoded in it). */
export function ShareButton({ className = "" }: { className?: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setState("ok");
    } catch {
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {state === "ok" ? "Link copiat" : "Copiază linkul"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "ok"
          ? "Linkul a fost copiat."
          : state === "fail"
            ? "Nu s-a putut copia; copiază adresa din bara browserului."
            : ""}
      </span>
    </>
  );
}
