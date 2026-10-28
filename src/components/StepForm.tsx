"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { BRANDS } from "@/lib/data";
import { BODY_LABEL, ENERGY_LABEL, USAGE_LABEL } from "@/lib/labels";
import type { Prefs } from "@/lib/scoring";
import type { Body } from "@/lib/types";
import {
  LIMITS,
  prefsToQuery,
  PREF_KEYS,
  validatePrefs,
  type FieldErrors,
  type PrefsInput,
} from "@/lib/validation";
import { BodyIcon } from "./BodyIcon";
import { btnGhost, btnPrimary, card } from "./ui";

const DEFAULTS: PrefsInput = {
  budgetMin: "4000",
  budgetMax: "10000",
  usage: "mixt",
  fuel: "oricare",
  body: "oricare",
  brand: "oricare",
  seats: "5",
  kmYear: "12000",
};

const STEPS: { title: string; fields: (keyof Prefs)[] }[] = [
  { title: "Buget", fields: ["budgetMin", "budgetMax"] },
  { title: "Utilizare", fields: ["usage"] },
  {
    title: "Combustibil, caroserie și marcă",
    fields: ["fuel", "body", "brand"],
  },
  { title: "Locuri și kilometri", fields: ["seats", "kmYear"] },
];

const ANY = { oricare: "Oricare" };
const BODY_ICONS = Object.fromEntries(
  (Object.keys(BODY_LABEL) as Body[]).map((b) => [
    b,
    <BodyIcon
      key={b}
      body={b}
      decorative
      className="text-accent-text mb-1 h-6 w-14"
    />,
  ]),
);
const USAGE_HINT = {
  oras: "Trasee scurte, parcare",
  autostrada: "Distanțe lungi",
  familie: "Spațiu, portbagaj",
  mixt: "Puțin din toate",
};

/** Reads pre-filled criteria from the URL (e.g. example scenarios, "Modifică criteriile"). */
export function StepFormFromUrl() {
  const params = useSearchParams();
  const initial = { ...DEFAULTS };
  for (const [k, short] of Object.entries(PREF_KEYS)) {
    const q = params.get(short);
    if (q) initial[k as keyof Prefs] = q;
  }
  return <StepForm key={params.toString()} initial={initial} />;
}

/** Rendered statically with defaults (Suspense fallback), so the page has no layout shift while the URL is read. */
export function StepForm({ initial = DEFAULTS }: { initial?: PrefsInput }) {
  const router = useRouter();
  const [values, setValues] = useState<PrefsInput>(initial);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [errors, setErrors] = useState<FieldErrors>({});
  const last = step === STEPS.length - 1;

  const set = (k: keyof Prefs) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const r = validatePrefs(values);
    const stepErrors = Object.fromEntries(
      Object.entries(r.errors).filter(([k]) =>
        STEPS[step].fields.includes(k as keyof Prefs),
      ),
    );
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      document.getElementById(`f-${Object.keys(stepErrors)[0]}`)?.focus();
      return;
    }
    if (!last) {
      setDir("next");
      return setStep(step + 1);
    }
    if (r.prefs) router.push(`/rezultate/?${prefsToQuery(r.prefs)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`${card} space-y-6 p-5 sm:p-7`}
      aria-labelledby="step-title"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted text-sm">
            Pasul {step + 1} din {STEPS.length}
          </p>
        </div>
        <ol className="grid grid-cols-4 gap-2" aria-hidden>
          {STEPS.map((st, i) => (
            <li key={st.title} className="space-y-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-surface-2"}`}
              />
              <span
                className={`hidden text-xs font-medium sm:block ${i === step ? "text-fg" : "text-muted"}`}
              >
                {st.title.split(",")[0]}
              </span>
            </li>
          ))}
        </ol>
        <h2
          id="step-title"
          className="font-display pt-1 text-2xl font-bold uppercase"
        >
          {STEPS[step].title}
        </h2>
      </div>

      <div key={step} className={`step-${dir} space-y-5`}>
        {step === 0 && (
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              id="budgetMin"
              label="Minim (€)"
              value={values.budgetMin}
              onChange={set("budgetMin")}
              error={errors.budgetMin}
              step={500}
              min={LIMITS.budget.min}
            />
            <NumberField
              id="budgetMax"
              label="Maxim (€)"
              value={values.budgetMax}
              onChange={set("budgetMax")}
              error={errors.budgetMax}
              step={500}
              min={LIMITS.budget.min}
            />
          </div>
        )}
        {step === 1 && (
          <Choice
            id="usage"
            legend="Cum folosești mașina cel mai des?"
            options={USAGE_LABEL}
            hints={USAGE_HINT}
            value={values.usage}
            onChange={set("usage")}
            error={errors.usage}
          />
        )}
        {step === 2 && (
          <>
            <Choice
              id="fuel"
              legend="Combustibil"
              options={{
                ...ANY,
                benzina: ENERGY_LABEL.benzina,
                motorina: ENERGY_LABEL.motorina,
                gpl: ENERGY_LABEL.gpl,
              }}
              value={values.fuel}
              onChange={set("fuel")}
              error={errors.fuel}
            />
            <Choice
              id="body"
              legend="Caroserie"
              options={{ ...ANY, ...BODY_LABEL }}
              icons={BODY_ICONS}
              value={values.body}
              onChange={set("body")}
              error={errors.body}
            />
            <Choice
              id="brand"
              legend="Marcă"
              compact
              options={{ ...ANY, ...Object.fromEntries(BRANDS) }}
              value={values.brand}
              onChange={set("brand")}
              error={errors.brand}
            />
          </>
        )}
        {step === 3 && (
          <>
            <Choice
              id="seats"
              legend="Minim locuri"
              options={Object.fromEntries(
                LIMITS.seats.map((s) => [String(s), String(s)]),
              )}
              value={values.seats}
              onChange={set("seats")}
              error={errors.seats}
            />
            <NumberField
              id="kmYear"
              label="Kilometri pe an"
              value={values.kmYear}
              onChange={set("kmYear")}
              error={errors.kmYear}
              step={1000}
              min={LIMITS.km.min}
            />
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          className={btnGhost}
          onClick={() => {
            setDir("prev");
            setStep(step - 1);
          }}
          disabled={step === 0}
          hidden={step === 0}
        >
          Înapoi
        </button>
        <button
          type="button"
          className="text-muted hover:text-fg ml-auto text-sm underline"
          onClick={() => {
            setValues(DEFAULTS);
            setErrors({});
            setDir("prev");
            setStep(0);
            router.replace("/", { scroll: false });
          }}
        >
          Resetează
        </button>
        <button type="submit" className={btnPrimary}>
          {last ? "Vezi recomandările" : "Continuă"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "font-display mt-1 w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-xl font-bold text-fg transition-colors focus:border-accent aria-invalid:border-accent";

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-err`} className="text-accent-text mt-1 text-sm font-medium">
      {error}
    </p>
  ) : null;
}

function NumberField(p: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  step: number;
  min: number;
}) {
  return (
    <div>
      <label htmlFor={`f-${p.id}`} className="text-sm font-medium">
        {p.label}
      </label>
      <input
        id={`f-${p.id}`}
        name={p.id}
        type="number"
        inputMode="numeric"
        min={p.min}
        step={p.step}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        aria-invalid={!!p.error}
        aria-describedby={p.error ? `${p.id}-err` : undefined}
        className={inputCls}
      />
      <ErrorText id={p.id} error={p.error} />
    </div>
  );
}

function Choice(p: {
  compact?: boolean;
  id: string;
  legend: string;
  options: Record<string, string>;
  hints?: Record<string, string>;
  icons?: Record<string, ReactNode>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={p.error ? `${p.id}-err` : undefined}>
      <legend className="text-sm font-medium">{p.legend}</legend>
      <div
        className={`mt-2 grid gap-2 ${p.compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}
      >
        {Object.entries(p.options).map(([v, label], i) => (
          <label
            key={v}
            className="border-line bg-surface-2/60 hover:border-accent/50 has-checked:border-accent has-checked:bg-accent/10 has-checked:ring-accent flex cursor-pointer flex-col rounded-xl border px-3 py-3 transition-colors has-checked:ring-1 has-focus-visible:outline-3 has-focus-visible:outline-[var(--focus)]"
          >
            <input
              id={i === 0 ? `f-${p.id}` : undefined}
              type="radio"
              name={p.id}
              value={v}
              checked={p.value === v}
              onChange={() => p.onChange(v)}
              className="sr-only"
            />
            {p.icons?.[v]}
            <span className="font-medium">{label}</span>
            {p.hints?.[v] && (
              <span className="text-muted text-xs">{p.hints[v]}</span>
            )}
          </label>
        ))}
      </div>
      <ErrorText id={p.id} error={p.error} />
    </fieldset>
  );
}
