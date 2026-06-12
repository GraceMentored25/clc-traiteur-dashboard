import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion des données — C.LC. Traiteur" };

const DataClient = dynamic(() => import("@/components/data/DataClient"), {
  loading: () => <PageLoader />,
});

export default function DataPage() {
  return <DataClient />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  );
}
