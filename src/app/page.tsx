import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl p-4">
      <h1 className="text-2xl font-bold">{SITE.title}</h1>
    </main>
  );
}
