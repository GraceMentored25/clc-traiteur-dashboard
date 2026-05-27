"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  const router = useRouter();
  // Wait for Zustand persist hydration before checking auth
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) router.replace("/auth");
  }, [hydrated, user, router]);

  // Show nothing until hydrated to avoid flash
  if (!hydrated) return null;
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] flex bg-[var(--surface)]">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-[100dvh] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
