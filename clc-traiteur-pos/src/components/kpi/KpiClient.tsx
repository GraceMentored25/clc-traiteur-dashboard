"use client";

import { useMemo, memo, useState } from "react";
import { m } from "framer-motion";
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
import { DISHES } from "@/lib/data/dishes";

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const CATEGORY_COLORS: Record<string, string> = {
  "Plats principaux": "#E8960C",
  "Grillades":        "#EF4444",
  "Poissons":         "#3FB950",
  "Entrées":          "#58A6FF",
  "Accompagnements":  "#A855F7",
  "Desserts":         "#EC4899",
  "Cocktails & Boissons": "#F97316",
};
const FALLBACK_COLORS = ["#6366F1","#14B8A6","#F59E0B","#84CC16","#06B6D4"];

// Mapping dishName → category depuis le catalogue complet
const DISH_CATEGORY: Record<string, string> = {};
for (const d of DISHES) DISH_CATEGORY[d.name.toLowerCase()] = d.category;

// ── SVG Area Chart ──────────────────────────────────────────────────────────
function AreaChartSVG({ data }: { data: { month: string; ca: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);
  const W = 560, H = 200, PL = 40, PR = 8, PT = 8, PB = 28;
  const maxVal = Math.max(...data.map((d) => d.ca), 1);
  const step = (W - PL - PR) / Math.max(data.length - 1, 1);

  const pts = data.map((d, i) => ({
    x: PL + i * step,
    y: PT + (1 - d.ca / maxVal) * (H - PT - PB),
    ...d,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${H - PB} L${pts[0].x},${H - PB} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PT + (1 - t) * (H - PT - PB),
    label: `${Math.round((maxVal * t) / 1000)}k`,
  }));

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8960C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E8960C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {yTicks.map((t) => (
          <g key={t.y}>
            <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <text x={PL - 4} y={t.y + 4} textAnchor="end" fill="#8B949E" fontSize={11}>{t.label}</text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#caGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#E8960C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* X labels + hover zones */}
        {pts.map((p) => (
          <g key={p.month}>
            <text x={p.x} y={H - 6} textAnchor="middle" fill="#8B949E" fontSize={11}>{p.month}</text>
            <circle cx={p.x} cy={p.y} r={3} fill="#E8960C" />
            <rect
              x={p.x - step / 2}
              y={PT}
              width={step}
              height={H - PT - PB}
              fill="transparent"
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, value: p.ca, label: p.month })}
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PT} x2={tooltip.x} y2={H - PB} stroke="rgba(255,255,255,0.1)" />
            <rect x={Math.min(tooltip.x + 8, W - 120)} y={tooltip.y - 28} width={108} height={26} rx={6} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
            <text x={Math.min(tooltip.x + 62, W - 66)} y={tooltip.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontFamily="monospace">
              {formatCurrency(tooltip.value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── SVG Bar Chart ───────────────────────────────────────────────────────────
function BarChartSVG({ data }: { data: { month: string; devis: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; label: string } | null>(null);
  const W = 560, H = 180, PL = 36, PR = 8, PT = 8, PB = 28;
  const maxVal = Math.max(...data.map((d) => d.devis), 1);
  const slotW = (W - PL - PR) / data.length;
  const barW = Math.min(28, slotW * 0.55);

  const bars = data.map((d, i) => {
    const bh = (d.devis / maxVal) * (H - PT - PB);
    return { x: PL + i * slotW + slotW / 2, y: H - PB - bh, h: bh, ...d };
  });

  const yTicks = [0, 0.5, 1].map((t) => ({
    y: PT + (1 - t) * (H - PT - PB),
    label: `${Math.round(maxVal * t)}`,
  }));

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" onMouseLeave={() => setTooltip(null)}>
        {yTicks.map((t) => (
          <g key={t.y}>
            <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
            <text x={PL - 4} y={t.y + 4} textAnchor="end" fill="#8B949E" fontSize={11}>{t.label}</text>
          </g>
        ))}

        {bars.map((b) => (
          <g key={b.month}>
            <rect
              x={b.x - barW / 2}
              y={b.y}
              width={barW}
              height={b.h}
              rx={6}
              fill="#E8960C"
              fillOpacity={0.85}
            />
            <text x={b.x} y={H - 6} textAnchor="middle" fill="#8B949E" fontSize={11}>{b.month}</text>
            <rect
              x={b.x - slotW / 2}
              y={PT}
              width={slotW}
              height={H - PT - PB}
              fill="transparent"
              onMouseEnter={() => setTooltip({ x: b.x, y: b.y, value: b.devis, label: b.month })}
            />
          </g>
        ))}

        {tooltip && (
          <g>
            <rect x={Math.min(tooltip.x + 8, W - 90)} y={tooltip.y - 6} width={80} height={24} rx={6} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1} />
            <text x={Math.min(tooltip.x + 48, W - 50)} y={tooltip.y + 10} textAnchor="middle" fill="var(--text-primary)" fontSize={11} fontFamily="monospace">
              {tooltip.value} devis
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── SVG Donut Chart ─────────────────────────────────────────────────────────
function DonutChartSVG({ data }: { data: { name: string; value: number; color: string }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const CX = 120, CY = 90, R_OUT = 76, R_IN = 50;
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;

  const arcs = data.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const startAngle = angle;
    angle += sweep;
    const endAngle = angle;
    const x1 = CX + R_OUT * Math.cos(startAngle), y1 = CY + R_OUT * Math.sin(startAngle);
    const x2 = CX + R_OUT * Math.cos(endAngle), y2 = CY + R_OUT * Math.sin(endAngle);
    const x3 = CX + R_IN * Math.cos(endAngle), y3 = CY + R_IN * Math.sin(endAngle);
    const x4 = CX + R_IN * Math.cos(startAngle), y4 = CY + R_IN * Math.sin(startAngle);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${x1},${y1} A${R_OUT},${R_OUT} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${R_IN},${R_IN} 0 ${large} 0 ${x4},${y4} Z`;
    return { ...d, path, i };
  });

  return (
    <svg width={240} height={180} style={{ display: "block", margin: "0 auto" }}>
      {arcs.map((arc) => (
        <path
          key={arc.name}
          d={arc.path}
          fill={arc.color}
          strokeWidth={hovered === arc.i ? 2 : 0}
          stroke="var(--surface-1)"
          opacity={hovered === null || hovered === arc.i ? 1 : 0.6}
          style={{ cursor: "pointer", transition: "opacity 0.15s" }}
          onMouseEnter={() => setHovered(arc.i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
      {hovered !== null && (
        <text x={CX} y={CY + 5} textAnchor="middle" fill="var(--text-primary)" fontSize={13} fontWeight="bold">
          {arcs[hovered].value}%
        </text>
      )}
    </svg>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function KpiClient() {
  // Sélecteurs granulaires — re-render uniquement si ces valeurs changent
  const devisList = useStore((s) => s.devisList);
  const appMode = useStore((s) => s.appMode);
  const customDishes = useStore((s) => s.customDishes);

  const isPro = appMode === "pro";
  const hasData = devisList.length > 0;

  // Mapping dynamique incluant les plats personnalisés
  const dishCategory = useMemo(() => {
    const map: Record<string, string> = { ...DISH_CATEGORY };
    for (const d of customDishes) map[d.name.toLowerCase()] = d.category;
    return map;
  }, [customDishes]);

  const { metrics, monthlyData, categoryData, topDishes } = useMemo(() => {
    const now = new Date();
    const curY = now.getFullYear();
    const curM = now.getMonth();

    const confirmed = devisList.filter((d) => d.status === "Confirmé");
    const sent = devisList.filter((d) => d.status === "Envoyé");

    // ── Métriques période courante (30 derniers jours) ─────────────────────
    const cutCur = new Date(curY, curM, 1);
    const cutPrev = new Date(curY, curM - 1, 1);

    const thisPeriod = devisList.filter((d) => new Date(d.createdAt) >= cutCur);
    const prevPeriod = devisList.filter((d) => {
      const c = new Date(d.createdAt);
      return c >= cutPrev && c < cutCur;
    });

    const thisConfirmed = thisPeriod.filter((d) => d.status === "Confirmé");
    const prevConfirmed = prevPeriod.filter((d) => d.status === "Confirmé");

    const totalCA = confirmed.reduce((s, d) => s + d.totalTTC, 0);
    const thisCA = thisConfirmed.reduce((s, d) => s + d.totalTTC, 0);
    const prevCA = prevConfirmed.reduce((s, d) => s + d.totalTTC, 0);

    const avgDevis = confirmed.length ? totalCA / confirmed.length : 0;
    const thisAvg = thisConfirmed.length ? thisCA / thisConfirmed.length : 0;
    const prevAvg = prevConfirmed.length ? (prevConfirmed.reduce((s, d) => s + d.totalTTC, 0) / prevConfirmed.length) : 0;

    const convRate = devisList.length ? Math.round((confirmed.length / devisList.length) * 100) : 0;
    const thisConv = thisPeriod.length ? Math.round((thisConfirmed.length / thisPeriod.length) * 100) : 0;
    const prevConv = prevPeriod.length ? Math.round((prevConfirmed.length / prevPeriod.length) * 100) : 0;

    // ── Deltas calculés (mois courant vs mois précédent) ──────────────────
    const pct = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? "+100%" : null;
      const d = Math.round(((cur - prev) / prev) * 100);
      return d >= 0 ? `+${d}%` : `${d}%`;
    };
    const pts = (cur: number, prev: number) => {
      const d = cur - prev;
      if (d === 0) return null;
      return d > 0 ? `+${d} pts` : `${d} pts`;
    };

    const deltaCA = pct(thisCA, prevCA);
    const deltaDevis = thisPeriod.length - prevPeriod.length;
    const deltaDevisStr = deltaDevis === 0 ? null : deltaDevis > 0 ? `+${deltaDevis}` : `${deltaDevis}`;
    const deltaConv = pts(thisConv, prevConv);
    const deltaAvg = pct(thisAvg, prevAvg);

    // ── Graphique 6 mois ───────────────────────────────────────────────────
    const slots = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(curY, curM - 5 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
    });
    const monthly = slots.map(({ year, month, label }) => {
      const inMonth = devisList.filter((d) => {
        const c = new Date(d.createdAt);
        return c.getFullYear() === year && c.getMonth() === month;
      });
      const ca = inMonth.filter((d) => d.status === "Confirmé").reduce((s, d) => s + d.totalTTC, 0);
      return { month: label, devis: inMonth.length, ca };
    });

    // ── Répartition catégories ─────────────────────────────────────────────
    const catQty: Record<string, number> = {};
    for (const devis of confirmed) {
      for (const item of devis.items) {
        const cat = dishCategory[item.dishName.toLowerCase()] ?? "Autres";
        catQty[cat] = (catQty[cat] ?? 0) + item.quantity;
      }
    }
    const totalQty = Object.values(catQty).reduce((s, v) => s + v, 0);
    let fi = 0;
    const categoryData = Object.entries(catQty)
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => ({
        name,
        value: totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0,
        color: CATEGORY_COLORS[name] ?? FALLBACK_COLORS[fi++ % FALLBACK_COLORS.length],
      }));

    // ── Top plats ──────────────────────────────────────────────────────────
    const dishQty: Record<string, number> = {};
    for (const devis of confirmed) {
      for (const item of devis.items) {
        dishQty[item.dishName] = (dishQty[item.dishName] ?? 0) + item.quantity;
      }
    }
    const sortedDishes = Object.entries(dishQty).sort((a, b) => b[1] - a[1]);
    const topDishes = sortedDishes.slice(0, 5).map(([name, orders], i) => {
      const prevOrders = sortedDishes[i + 1]?.[1] ?? orders;
      const diff = prevOrders > 0 ? Math.round(((orders - prevOrders) / prevOrders) * 100) : 0;
      return { name, orders, trend: diff >= 0 ? `+${diff}%` : `${diff}%` };
    });

    return {
      metrics: {
        totalCA, totalDevis: devisList.length, confirmed: confirmed.length,
        convRate, avgDevis, pending: sent.length,
        deltaCA, deltaDevisStr, deltaConv, deltaAvg,
        deltaCAPositive: (deltaCA ?? "").startsWith("+"),
        deltaDevisPositive: deltaDevis >= 0,
        deltaConvPositive: (deltaConv ?? "").startsWith("+"),
        deltaAvgPositive: (deltaAvg ?? "").startsWith("+"),
      },
      monthlyData: monthly,
      categoryData,
      topDishes,
    };
  }, [devisList, dishCategory]);

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh] space-y-6 lg:space-y-8">
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
        <KpiCard label="Chiffre d'affaires TTC" value={formatCurrency(metrics.totalCA)} icon={<CurrencyEur size={18} weight="fill" />} delta={metrics.deltaCA} positive={metrics.deltaCAPositive} accent delay={0} />
        <KpiCard label="Devis générés" value={metrics.totalDevis.toString()} icon={<Receipt size={18} weight="fill" />} delta={metrics.deltaDevisStr} positive={metrics.deltaDevisPositive} delay={0.06} />
        <KpiCard label="Taux de conversion" value={`${metrics.convRate}%`} icon={<TrendUp size={18} weight="fill" />} delta={metrics.deltaConv} positive={metrics.deltaConvPositive} delay={0.12} />
        <KpiCard label="Valeur moy. devis" value={formatCurrency(metrics.avgDevis)} icon={<CheckCircle size={18} weight="fill" />} delta={metrics.deltaAvg} positive={metrics.deltaAvgPositive} delay={0.18} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Évolution du CA</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">6 derniers mois</p>
            </div>
            {!isPro && <span className="text-xs font-semibold text-[var(--success)] bg-green-500/10 px-2.5 py-1 rounded-lg">+28.3%</span>}
          </div>
          <AreaChartSVG data={monthlyData} />
        </div>

        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Répartition catégories</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">En % des commandes</p>
          {!hasData || categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">Aucune donnée — ajoutez des devis confirmés</p>
            </div>
          ) : (
            <>
              <DonutChartSVG data={categoryData} />
              <div className="space-y-2 mt-2">
                {categoryData.map((c) => (
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
        <div className="lg:col-span-2 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Volume de devis</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Nombre par mois</p>
            </div>
          </div>
          <BarChartSVG data={monthlyData} />
        </div>

        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 lg:p-6">
          <h3 className="font-bold text-[var(--text-primary)] text-sm mb-1">Top plats</h3>
          <p className="text-xs text-[var(--text-muted)] mb-5">Commandes cumulées</p>
          {!hasData || topDishes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-[var(--text-muted)]">Aucune donnée — ajoutez des devis confirmés</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDishes.map((dish, i) => {
                const positive = dish.trend.startsWith("+");
                return (
                  <div key={dish.name} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[var(--text-muted)] w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{dish.name}</p>
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {positive ? <ArrowUp size={9} weight="bold" /> : <ArrowDown size={9} weight="bold" />}
                          {dish.trend.slice(1)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--amber)]" style={{ width: `${(dish.orders / topDishes[0].orders) * 100}%`, opacity: 0.6 + i * 0.08 }} />
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

const KpiCard = memo(function KpiCard({ label, value, icon, delta, positive, accent = false, delay = 0 }: {
  label: string; value: string; icon: React.ReactNode; delta: string | null; positive: boolean; accent?: boolean; delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 25 }}
      className={`p-5 rounded-2xl border transition-all ${accent ? "bg-[var(--amber)]/8 border-[var(--amber)]/20" : "bg-[var(--surface-1)] border-[var(--border)]"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent ? "bg-[var(--amber)]/20 text-[var(--amber)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)]"}`}>
          {icon}
        </div>
        {delta !== null && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {positive ? <ArrowUp size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono tracking-tight ${accent ? "text-[var(--amber)]" : "text-[var(--text-primary)]"}`}>{value}</p>
    </m.div>
  );
});
