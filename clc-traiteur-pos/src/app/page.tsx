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
    <div className="min-h-[100dvh] flex relative overflow-hidden">
      <div className="absolute inset-0 bg-cover"
        style={{ backgroundImage: "url(/auth4x.png)", backgroundPosition: "35% center" }} />
      <div className="absolute inset-0 md:hidden bg-gradient-to-b from-black/55 via-black/35 to-black/70" />

      {/* Left panel — overlay sombre sur l'image */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/newlogo.png"
              alt="Chez La Camerounaise"
              width={56}
              height={56}
              className="shrink-0 rounded-full"
              priority
            />
            <span className="text-white font-semibold text-lg tracking-tight">
              Chez La Camerounaise
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white tracking-tight leading-tight mb-3">
            Saveurs africaines,<br />excellence culinaire.
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Gérez vos événements, devis et commandes depuis un seul espace.
          </p>
          <div className="mt-8 flex items-center gap-6">
            {[
              { label: "Événements gérés", value: "247+" },
              { label: "Clients satisfaits", value: "183" },
              { label: "Note moyenne", value: "4.9/5" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-white/50 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right panel — transparent */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="w-full md:bg-transparent md:border-0 md:shadow-none md:backdrop-blur-0 rounded-3xl md:rounded-none border border-white/12 bg-black/28 backdrop-blur-md shadow-2xl px-5 py-6 md:p-0" style={{ maxWidth: "400px" }}>
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <Image src="/newlogo.png" alt="Chez La Camerounaise" width={40} height={40}
                className="w-full h-full object-cover" priority />
            </div>
            <span className="font-semibold text-white drop-shadow">Chez La Camerounaise</span>
          </div>

          <div className="md:hidden mb-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/70 mb-2">
              Espace administration
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Bienvenue
            </h1>
            <p className="text-sm text-white/70 mt-2 leading-relaxed">
              Gérez vos événements, devis et commandes depuis un seul espace.
            </p>
          </div>

          <p className="hidden md:block text-sm font-semibold mb-1 tracking-widest uppercase" style={{ color: "#7A4F1E" }}>
            Espace administration
          </p>
          <h1 className="hidden md:block text-3xl font-bold tracking-tight mb-8" style={{ color: "var(--amber)" }}>
            Bienvenue
          </h1>

          <AuthFormClient />

          <p className="text-center text-xs mt-8 text-white/65 md:text-[color:#1A1A1A] md:opacity-60">
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
