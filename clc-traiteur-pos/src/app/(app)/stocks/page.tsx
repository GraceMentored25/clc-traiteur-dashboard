import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gestion des stocks — C.LC. Traiteur" };

const StocksClient = dynamic(() => import("@/components/stocks/StocksClient"), {
  loading: () => <PageLoader />,
});

export default function StocksPage() {
  return <StocksClient />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  );
}
