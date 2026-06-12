import dynamic from "next/dynamic";

export const metadata = { title: "Gestion comptable — C.LC. Traiteur" };

const ComptabiliteClient = dynamic(() => import("@/components/comptabilite/ComptabiliteClient"), {
  loading: () => <PageLoader />,
});

export default function ComptabilitePage() {
  return <ComptabiliteClient />;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  );
}
