"use client";

import dynamic from "next/dynamic";

const PantauApp = dynamic(
  () => import("@/components/pantau-app").then((mod) => mod.PantauApp),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Membuka papan kerja…
      </div>
    ),
  },
);

export default function Home() {
  return <PantauApp />;
}
