import dynamic from "next/dynamic";

export const metadata = { title: "Paramètres — C.LC. Traiteur" };

const ParametresClient = dynamic(() => import("@/components/parametres/ParametresClient"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  ),
});

export default function ParametresPage() {
  return <ParametresClient />;
}
