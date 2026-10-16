import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui";

export const metadata: Metadata = {
  title: "Fără conexiune",
  robots: { index: false },
};

export default function Page() {
  return (
    <Notice title="Ești offline">
      <p className="text-muted">
        Pagina cerută nu este salvată pe acest dispozitiv. Paginile vizitate
        anterior și ghidurile principale funcționează și fără internet.
      </p>
      <Link href="/" className="underline">
        Înapoi la prima pagină
      </Link>
    </Notice>
  );
}
