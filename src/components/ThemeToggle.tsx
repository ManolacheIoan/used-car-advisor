"use client";

/** Dark by default. The choice is kept in localStorage (no cookies). Label swaps via CSS, so no hydration state. */
export const THEME_SCRIPT = `try{if(localStorage.getItem("theme")==="light")document.documentElement.dataset.theme="light"}catch(e){}`;

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";
    if (next === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="border-line text-muted hover:text-fg rounded-md border px-3 py-1.5 text-sm"
    >
      <span className="in-data-[theme=light]:hidden">
        Temă<span className="max-sm:sr-only"> luminoasă</span>
      </span>
      <span className="hidden in-data-[theme=light]:inline">
        Temă<span className="max-sm:sr-only"> întunecată</span>
      </span>
    </button>
  );
}
