import type { Prefs } from "@/lib/scoring";

/** Example scenarios shown on the home page. Results are computed at build time from verified models only. */
export const SCENARIOS: { id: string; title: string; prefs: Prefs }[] = [
  {
    id: "oras-benzina",
    title: "Buget 4.000–8.000 €, oraș, benzină",
    prefs: {
      budgetMin: 4000,
      budgetMax: 8000,
      usage: "oras",
      fuel: "benzina",
      body: "oricare",
      seats: 5,
      kmYear: 10000,
    },
  },
  {
    id: "familie",
    title: "Buget 8.000–15.000 €, familie, orice combustibil",
    prefs: {
      budgetMin: 8000,
      budgetMax: 15000,
      usage: "familie",
      fuel: "oricare",
      body: "oricare",
      seats: 5,
      kmYear: 15000,
    },
  },
  {
    id: "autostrada-motorina",
    title: "Buget 10.000–20.000 €, autostradă, motorină, 25.000 km/an",
    prefs: {
      budgetMin: 10000,
      budgetMax: 20000,
      usage: "autostrada",
      fuel: "motorina",
      body: "oricare",
      seats: 5,
      kmYear: 25000,
    },
  },
];
