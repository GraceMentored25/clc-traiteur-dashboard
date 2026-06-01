"use client";

import { useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendUp,
  Receipt,
  CheckCircle,
  CurrencyEur,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const CATEGORY_DATA = [
  { name: "Plats principaux", value: 34, color: "#E8960C" },
  { name: "Grillades", value: 22, color: "#EF4444" },
  { name: "Poissons", value: 17, color: "#3FB950" },
  { name: "Entrées", value: 13, color: "#58A6FF" },
  { name: "Accompagnements", value: 9, color: "#A855F7" },
  { name: "Cocktails & Boissons", value: 5, color: "#F97316" },
];

const TOP_DISHES = [
  { name: "Ndolé", orders: 247, trend: "+18%" },
  { name: "Porc Braisé", orders: 198, trend: "+12%" },
  { name: "Poulet DG", orders: 176, trend: "+7%" },
  { name: "Poisson Braisé", orders: 154, trend: "+22%" },
  { name: "Eru", orders: 131, trend: "-3%" },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-[var(--border)] text-xs">
      <p className="font-semibold text-[var(--text-secondary)] mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[var(--text-primary)] font-mono">
          {p.name === "ca" ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function KpiClient() {
  const { devisList, appMode } = useStore();
  const isPro = appMode === "pro";
  // Afficher les graphiques dès qu'il y a des données, peu importe le mode
  const hasData = devisList.length > 0;

  const { metrics, monthlyData } = useMemo(() => {
    const confirmed = devisList.filter((d) => d.status === "Confirmé");
    const sent = devisList.filter((d) => d.status === "Envoyé");
    const totalCA = confirmed.reduce((s, d) => s + d.totalTTC, 0);
    const avgDevis = confirmed.length ? totalCA / confirmed.length : 0;
    const convRate = devisList.length
      ? Math.round((confirmed.length / devisList.length) * 100)
      : 0;

    // Build last-6-months sliding window
    const now = new Date();
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
    });
    const monthly = slots.map(({ year, month, label }) => {
      const inMonth = devisList.filter((d) => {
        const c = new Date(d.createdAt);
        return c.getFullYear() === year && c.getMonth() === month;
      });
      const ca = inMonth
        .filter((d) => d.status === "Confirmé")
        .reduce((s, d) => s + d.totalTTC, 0);
      return { month: label, devis: inMonth.length, ca };
    });

    return {
      metrics: { totalCA, totalDevis: devisList.length, confirmed: confirmed.length, convRate, avgDevis, pending: sent.length },
      monthlyData: monthly,
    };
  }, [devisList]);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh] space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          KPI & Métriques
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isPro ? "Mode Production — données réelles" : "Performance globale — données cumulées"}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          label="Chiffre d'affaires TTC"
          value={formatCurrency(metrics.totalCA)}
          icon={<CurrencyEur size={18} weight="fill" />}
          delta={isPro ? null : "+23.4%"}
          positive
          accent
          delay={0}
        />
        <KpiCard
          label="Devis générés"
          value={metrics.totalDevis.toString()}
          icon={<Receipt size={18} weight="fill" />}
          delta={isPro ? null : "+6"}
          positive
          delay={0.06}
        />
        <KpiCard
          label="Taux de conversion"
          value={`${metrics.convRate}%`}
          icon={<TrendUp size={18} weight="fill" />}
          delta={isPro ? null : "+4.2 pts"}
          positive
          delay={0.12}
        />
        <KpiCard
          label="Valeur moy. devis"
          value={formatCurrency(metrics.avgDevis)}
          icon={<CheckCircle size={18} weight="fill" />}
          delta={isPro ? null : "-2.1%"}
          positive={false}
          delay={0.18}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Revenue area chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Évolution du CA</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">6 derniers mois</p>
            </div>
            {!isPro && (
              <span className="text-xs font-semibold text-[var(--success)] bg-green-500/10 px-2.5 py-1 rounded-lg">
                +28.3%
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8960C" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#E8960C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ca"
                name="ca"
                stroke="#E8960C"
                strokeWidth={2}
                fill="url(#caGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Répartition catégories</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">En % des commandes</p>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">Aucune donnée — ajoutez des devis confirmés</p>
            </div>
          ) : (
            <>
              <PieChart width={240} height={180} style={{ margin: "0 auto" }}>
                <Pie data={CATEGORY_DATA} cx={120} cy={90} innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={index} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v}%`, ""]}
                  contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "var(--text-secondary)" }}
                  itemStyle={{ color: "var(--text-primary)" }}
                />
              </PieChart>
              <div className="space-y-2 mt-2">
                {CATEGORY_DATA.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                      <span className="text-[var(--text-secondary)]">{c.name}</span>
                    </div>
                    <span className="font-mono font-medium text-[var(--text-primary)]">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bar chart + top dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Volume de devis</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Nombre par mois</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="devis" name="devis" fill="#E8960C" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top dishes */}
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Top plats</h3>
          <p className="text-xs text-[var(--text-muted)] mb-5">Commandes cumulées</p>
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">Aucune donnée — ajoutez des devis confirmés</p>
            </div>
          ) : (
          <div className="space-y-3">
            {TOP_DISHES.map((dish, i) => {
              const positive = dish.trend.startsWith("+");
              return (
                <div key={dish.name} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[var(--text-muted)] w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{dish.name}</p>
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                          positive ? "text-[var(--success)]" : "text-[var(--danger)]"
                        }`}
                      >
                        {positive ? <ArrowUp size={9} weight="bold" /> : <ArrowDown size={9} weight="bold" />}
                        {dish.trend.slice(1)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--amber)]"
                        style={{ width: `${(dish.orders / TOP_DISHES[0].orders) * 100}%`, opacity: 0.6 + i * 0.08 }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{dish.orders} commandes</p>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

const KpiCard = memo(function KpiCard({
  label,
  value,
  icon,
  delta,
  positive,
  accent = false,
  delay = 0,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  delta: string | null;
  positive: boolean;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 25 }}
      className={`p-5 rounded-2xl border transition-all ${
        accent
          ? "bg-[var(--amber)]/8 border-[var(--amber)]/20"
          : "bg-[var(--surface-1)] border-[var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            accent
              ? "bg-[var(--amber)]/20 text-[var(--amber)]"
              : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
          }`}
        >
          {icon}
        </div>
        {delta !== null && (
          <span
            className={`text-xs font-semibold flex items-center gap-0.5 ${
              positive ? "text-[var(--success)]" : "text-[var(--danger)]"
            }`}
          >
            {positive ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mb-1">{label}</p>
      <p
        className={`text-xl font-bold font-mono tracking-tight ${
          accent ? "text-[var(--amber)]" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </motion.div>
  );
});
