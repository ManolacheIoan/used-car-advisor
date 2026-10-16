import type { Metadata } from "next";
import { Favorites } from "@/components/Favorites";

export const metadata: Metadata = {
  title: "Favorite",
  robots: { index: false },
};

export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Favorite</h1>
      <Favorites />
    </div>
  );
}
