import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Création de devis — C.LC. Traiteur" };

const DashboardClient = dynamic(() => import("@/components/dashboard/DashboardClient"), {
  loading: () => <PageLoader />,
});

export default function DashboardPage() {
  return <DashboardClient />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  );
}
