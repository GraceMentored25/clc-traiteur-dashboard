"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { m, AnimatePresence } from "framer-motion";
import { Eye, EyeSlash, WarningCircle, ArrowRight } from "@phosphor-icons/react";
import { useStore } from "@/lib/store";

const schema = z.object({
  username: z.string().min(1, "Identifiant requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

// Politique minimale de complexité côté client (vérification UI uniquement)
const PASSWORD_MIN_LENGTH = 8;

type FormData = z.infer<typeof schema>;

export default function AuthFormClient() {
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
    try {
      // Vérification côté serveur uniquement — jamais côté client
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        login(data.username, data.password); // synchronise l'état UI uniquement
        router.push("/dashboard");
      } else {
        setAuthError(json.error ?? "Identifiant ou mot de passe incorrect.");
        setLoading(false);
      }
    } catch {
      setAuthError("Erreur de connexion. Réessayez.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {/* Username */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={{ color: "rgba(26,26,26,0.6)" }}>
          Identifiant
        </label>
        <input
          {...register("username")}
          type="text"
          autoComplete="username"
          placeholder="Votre identifiant"
          style={{ background: "rgba(255,255,255,0.75)", borderColor: "rgba(180,140,80,0.3)", color: "#2A1F08" }}
          className="w-full h-11 px-4 rounded-xl border text-sm outline-none transition-all focus:ring-2 placeholder:text-[#B09050]/60"
        />
        {errors.username && (
          <p className="text-xs text-[var(--danger)] flex items-center gap-1 mt-1">
            <WarningCircle size={13} /> {errors.username.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={{ color: "rgba(26,26,26,0.6)" }}>
          Mot de passe
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            style={{ background: "rgba(255,255,255,0.75)", borderColor: "rgba(180,140,80,0.3)", color: "#2A1F08" }}
            className="w-full h-11 px-4 pr-11 rounded-xl border text-sm outline-none transition-all focus:ring-2 placeholder:text-[#B09050]/60"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#B09050" }}
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
  );
}
