import dynamic from "next/dynamic";

export const metadata = { title: "Organisation — C.LC. Traiteur" };

const OrganisationClient = dynamic(() => import("@/components/organisation/OrganisationClient"), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)] text-sm">
      Chargement…
    </div>
  ),
});

export default function OrganisationPage() {
  return <OrganisationClient />;
}
