"use client";

import { useState } from "react";
import { ShoppingCart, BookOpen, ListChecks, Archive } from "@phosphor-icons/react";
import TabCommandes from "./TabCommandes";
import TabRessources from "./TabRessources";
import TabCourses from "./TabCourses";
import TabStocks from "./TabStocks";

const TABS = [
  { id: "commandes", label: "Commandes et devis", icon: ShoppingCart },
  { id: "courses", label: "Courses", icon: ListChecks },
  { id: "ressources", label: "Ressources", icon: BookOpen },
  { id: "stocks", label: "Stocks", icon: Archive },
] as const;

type TabId = typeof TABS[number]["id"];

export default function StocksClient() {
  const [activeTab, setActiveTab] = useState<TabId>("commandes");

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-8 min-h-[100dvh]">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Gestion des stocks
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Courses, ressources, logistique et inventaire</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mb-6 bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border)]">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-[var(--amber)] text-[var(--surface)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}>
            <tab.icon size={13} weight={activeTab === tab.id ? "fill" : "regular"} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {activeTab === "commandes" && <TabCommandes />}
      {activeTab === "ressources" && <TabRessources />}
      {activeTab === "courses" && <TabCourses />}
      {activeTab === "stocks" && <TabStocks />}
    </div>
  );
}
