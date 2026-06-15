import Image from "next/image";
import dynamic from "next/dynamic";

export const metadata = {
  title: "Connexion — C.LC. Traiteur",
};

const AuthFormClient = dynamic(() => import("@/components/auth/AuthFormClient"), {
  loading: () => <FormSkeleton />,
});

export default function Home() {
  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center overflow-hidden">
      {/* Image de fond plein écran */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/auth.jpeg)" }}
      />
      {/* Overlay sombre uniforme */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.68)" }} />

      {/* Formulaire centré */}
      <div className="relative z-10 w-full px-4" style={{ maxWidth: "420px", margin: "0 auto" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <Image src="/logo.png" alt="Chez La Camerounaise" width={48} height={48}
            className="shrink-0 rounded-full" priority />
          <span className="text-white font-semibold text-base tracking-tight">Chez La Camerounaise</span>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl border px-7 py-7" style={{ background: "rgba(22,27,34,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.1)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}>
          <p className="text-[var(--text-secondary)] text-xs font-semibold mb-1 tracking-widest uppercase">
            Espace administration
          </p>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-7">
            Bienvenue
          </h1>
          <AuthFormClient />
          <p className="text-center text-xs text-[var(--text-muted)] mt-7">
            Accès réservé au personnel autorisé C.LC. Traiteur
          </p>
        </div>
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="space-y-1.5">
        <div className="h-4 w-20 bg-[var(--surface-3)] rounded" />
        <div className="h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]" />
      </div>
      <div className="space-y-1.5">
        <div className="h-4 w-24 bg-[var(--surface-3)] rounded" />
        <div className="h-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]" />
      </div>
      <div className="h-11 rounded-xl bg-[var(--amber)]/30" />
    </div>
  );
}
