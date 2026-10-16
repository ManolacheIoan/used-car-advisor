"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BODY_LABEL, ENERGY_LABEL, USAGE_LABEL } from "@/lib/labels";
import type { Prefs } from "@/lib/scoring";
import {
  LIMITS,
  prefsToQuery,
  PREF_KEYS,
  validatePrefs,
  type FieldErrors,
  type PrefsInput,
} from "@/lib/validation";
import { btnGhost, btnPrimary, card } from "./ui";

const DEFAULTS: PrefsInput = {
  budgetMin: "4000",
  budgetMax: "10000",
  usage: "mixt",
  fuel: "oricare",
  body: "oricare",
  seats: "5",
  kmYear: "12000",
};

const STEPS: { title: string; fields: (keyof Prefs)[] }[] = [
  { title: "Buget", fields: ["budgetMin", "budgetMax"] },
  { title: "Utilizare", fields: ["usage"] },
  { title: "Combustibil și caroserie", fields: ["fuel", "body"] },
  { title: "Locuri și kilometri", fields: ["seats", "kmYear"] },
];

const ANY = { oricare: "Oricare" };
const USAGE_HINT = {
  oras: "Trasee scurte, parcare",
  autostrada: "Distanțe lungi",
  familie: "Spațiu, portbagaj",
  mixt: "Puțin din toate",
};

export function StepForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [values, setValues] = useState<PrefsInput>(() => {
    const v = { ...DEFAULTS };
    for (const [k, short] of Object.entries(PREF_KEYS)) {
      const q = params.get(short);
      if (q) v[k as keyof Prefs] = q;
    }
    return v;
  });
  const [step, setStep] = useState(0);
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
    if (!last) return setStep(step + 1);
    if (r.prefs) router.push(`/rezultate/?${prefsToQuery(r.prefs)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={`${card} space-y-5`}
      aria-labelledby="step-title"
    >
      <div>
        <p className="text-muted text-sm">
          Pasul {step + 1} din {STEPS.length}
        </p>
        <div className="bg-surface-2 mt-2 h-1.5 rounded-full" aria-hidden>
          <div
            className="bg-accent h-full rounded-full transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <h2 id="step-title" className="mt-3 text-lg font-semibold">
          {STEPS[step].title}
        </h2>
      </div>

      <div key={step} className="animate-rise space-y-5">
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
              value={values.body}
              onChange={set("body")}
              error={errors.body}
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
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          hidden={step === 0}
        >
          Înapoi
        </button>
        <button type="submit" className={`${btnPrimary} ml-auto`}>
          {last ? "Vezi recomandările" : "Continuă"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-fg aria-invalid:border-accent";

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
  id: string;
  legend: string;
  options: Record<string, string>;
  hints?: Record<string, string>;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset aria-describedby={p.error ? `${p.id}-err` : undefined}>
      <legend className="text-sm font-medium">{p.legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Object.entries(p.options).map(([v, label], i) => (
          <label
            key={v}
            className="border-line bg-surface-2 has-checked:border-accent has-checked:ring-accent has-focus-visible:outline-accent flex cursor-pointer flex-col rounded-lg border px-3 py-2.5 has-checked:ring-1 has-focus-visible:outline-3"
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
