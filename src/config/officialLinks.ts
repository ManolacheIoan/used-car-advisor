/**
 * Official institutions linked from guides. `checked` = last automated check (HTTP status) and its date.
 * The link checker (npm run check:links) re-tests them; results are written to data/link-report.md.
 */
export const OFFICIAL_LINKS = {
  rar: {
    name: "Registrul Auto Român (RAR)",
    url: "https://www.rarom.ro/",
    purpose:
      "inspecția tehnică periodică (ITP), omologări, informații despre vehicule",
    checked: { on: "2026-10-16", status: "timeout (de verificat manual)" },
  },
  dgpci: {
    name: "Direcția Regim Permise de Conducere și Înmatriculare a Vehiculelor (MAI)",
    url: "https://dgpci.mai.gov.ro/",
    purpose: "înmatriculare, transcriere, programări",
    checked: { on: "2026-10-16", status: "200" },
  },
  asf: {
    name: "Autoritatea de Supraveghere Financiară (ASF)",
    url: "https://asfromania.ro/",
    purpose: "asigurări (RCA), informații pentru consumatori",
    checked: { on: "2026-10-16", status: "200" },
  },
  anpc: {
    name: "Autoritatea Națională pentru Protecția Consumatorilor (ANPC)",
    url: "https://anpc.ro/",
    purpose: "drepturile consumatorilor, reclamații",
    checked: { on: "2026-10-16", status: "503 (de verificat manual)" },
  },
  anaf: {
    name: "Agenția Națională de Administrare Fiscală (ANAF)",
    url: "https://www.anaf.ro/",
    purpose: "fiscalitate",
    checked: { on: "2026-10-16", status: "200" },
  },
  cnair: {
    name: "Compania Națională de Administrare a Infrastructurii Rutiere (CNAIR)",
    url: "https://cnair.ro/",
    purpose: "rovinietă / tarifare rutieră",
    checked: { on: "2026-10-16", status: "200" },
  },
  bnr: {
    name: "Banca Națională a României (BNR)",
    url: "https://www.bnr.ro/",
    purpose: "cursul de referință",
    checked: { on: "2026-10-16", status: "200" },
  },
} as const;
