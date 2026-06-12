import dynamic from "next/dynamic";

export const metadata = { title: "KPI & Métriques — C.LC. Traiteur" };

const KpiClient = dynamic(() => import("@/components/kpi/KpiClient"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement des métriques…
    </div>
  ),
});

export default function KpiPage() {
  return <KpiClient />;
}
