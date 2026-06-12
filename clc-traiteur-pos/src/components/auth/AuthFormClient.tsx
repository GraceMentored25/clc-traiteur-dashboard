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
  );
}
