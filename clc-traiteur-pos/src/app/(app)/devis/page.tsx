import dynamic from "next/dynamic";

export const metadata = { title: "Gestion de devis — C.LC. Traiteur" };

const DevisClient = dynamic(() => import("@/components/devis/DevisClient"), {
  loading: () => <PageLoader />,
});

export default function DevisPage() {
  return <DevisClient />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  );
}
