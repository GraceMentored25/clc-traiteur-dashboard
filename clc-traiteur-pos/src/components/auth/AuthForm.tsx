"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { m, AnimatePresence } from "framer-motion";
import { Eye, EyeSlash, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";

const schema = z.object({
  username: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

type FormData = z.infer<typeof schema>;

export default function AuthForm() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [showPwd, setShowPwd] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setAuthError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    const ok = login(data.username, data.password);
    if (ok) {
      router.push("/dashboard");
    } else {
      setAuthError("Identifiant ou mot de passe incorrect.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left panel — image */}
      <m.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex md:w-1/2 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/auth.jpeg)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        {/* Overlay content */}
        <div className="relative z-10 flex flex-col justify-end p-12">
          <m.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo.png" alt="Chez La Camerounaise" width={56} height={56} className="shrink-0 rounded-full" priority />
              <span className="text-white font-semibold text-lg tracking-tight">Chez La Camerounaise</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight leading-tight mb-3">
              Saveurs africaines,<br />excellence culinaire.
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">
              Gérez vos événements, devis et commandes depuis un seul espace.
            </p>
          </m.div>

          <m.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex items-center gap-6"
          >
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
          </m.div>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </m.div>

      {/* Right panel — form */}
      <m.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-[var(--surface)]"
      >
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[var(--surface-3)]">
              <Image src="/logo.png" alt="Chez La Camerounaise" width={40} height={40} className="w-full h-full object-cover" priority />
            </div>
            <span className="font-semibold text-[var(--text-primary)]">Chez La Camerounaise</span>
          </div>

          <m.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="text-[var(--text-secondary)] text-sm font-medium mb-1 tracking-wide uppercase">
              Espace administration
            </p>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-8">
              Bienvenue
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Identifiant
                </label>
                <input
                  {...register("username")}
                  type="text"
                  autoComplete="username"
                  placeholder="admin"
                  className="w-full h-11 px-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none transition-all focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15"
                />
                {errors.username && (
                  <p className="text-xs text-[var(--danger)] flex items-center gap-1 mt-1">
                    <WarningCircle size={13} /> {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••"
                    className="w-full h-11 px-4 pr-11 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm outline-none transition-all focus:border-[var(--amber)] focus:ring-2 focus:ring-[var(--amber)]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPwd ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-[var(--danger)] flex items-center gap-1 mt-1">
                    <WarningCircle size={13} /> {errors.password.message}
                  </p>
                )}
              </div>

              {/* Auth error */}
              <AnimatePresence>
                {authError && (
                  <m.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[var(--danger)] text-sm"
                  >
                    <WarningCircle size={16} weight="fill" />
                    {authError}
                  </m.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <m.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full h-11 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-light)] disabled:opacity-60 disabled:cursor-not-allowed text-[var(--surface)] font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[var(--surface)]/30 border-t-[var(--surface)] animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </m.button>
            </form>

            <p className="text-center text-xs text-[var(--text-muted)] mt-8">
              Accès réservé au personnel autorisé C.LC. Traiteur
            </p>
          </m.div>
        </div>
      </m.div>
    </div>
  );
}
