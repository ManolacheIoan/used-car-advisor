import type { Metadata } from "next";
import { Favorites } from "@/components/Favorites";

export const metadata: Metadata = {
  title: "Favorite și văzute recent",
  description:
    "Modelele salvate și cele văzute recent, păstrate doar în browserul tău.",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Favorite</h1>
      <Favorites />
    </div>
  );
}
