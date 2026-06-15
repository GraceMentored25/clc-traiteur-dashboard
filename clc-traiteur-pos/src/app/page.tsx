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
      {/* Overlay sombre pour la lisibilité */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Glow accent */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Formulaire centré — carte flottante */}
      <div className="relative z-10 w-full max-w-[440px] mx-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Image
            src="/logo.png"
            alt="Chez La Camerounaise"
            width={52}
            height={52}
            className="shrink-0 rounded-full"
            priority
          />
          <span className="text-white font-semibold text-lg tracking-tight">
            Chez La Camerounaise
          </span>
        </div>

        {/* Carte formulaire */}
        <div className="rounded-2xl bg-[var(--surface-1)]/90 backdrop-blur-md border border-white/10 px-8 py-8 shadow-2xl">
          <p className="text-[var(--text-secondary)] text-sm font-medium mb-1 tracking-wide uppercase">
            Espace administration
          </p>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-8">
            Bienvenue
          </h1>

          <AuthFormClient />

          <p className="text-center text-xs text-[var(--text-muted)] mt-8">
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
