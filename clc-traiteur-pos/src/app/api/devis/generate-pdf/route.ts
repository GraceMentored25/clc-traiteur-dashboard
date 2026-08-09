export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Devis, DevisItem } from "@/lib/types";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "devis_modele.html");

const MOIS = ["","janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];

function fmtDate(iso: string): string {
  try { const [y,m,d]=iso.split("-"); return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`; }
  catch { return iso; }
}
function fmtMoney(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// ── Groupement sections ──────────────────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }
function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string, DevisItem[]>();
  for (const item of items) {
    const key = item.section ?? "Prestation";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, its]) => ({
    label, items: its, subtotal: its.reduce((s,i) => s + i.quantity * i.unitPrice, 0),
  }));
}

function isService(dishName: string): boolean {
  const services = ["serveur","marmite","service de table","tente","chapiteau","table","chaise","déco","décoration","transport","livraison","sono","animation","photographe"];
  const n = dishName.toLowerCase();
  return services.some(s => n.includes(s));
}

// ── Mapping événement → indices pages ────────────────────────────────────────
// Pages du template (1-indexed):
// 1  = Cover
// 2-7 = Détail event (mariage=2-3, anniversaire=3-4, bapteme=4-5, séminaire=5-6, réception=6-7)
// En réalité, chaque page event correspond à un moment de la journée
// 7  = Prestations additionnelles
// 8-17 = Récapitulatifs et acomptes par événement (par paires)
// 18 = Infos CLC Traiteur
// 19 = Légende (à supprimer toujours)
// 20 = Signature/Mentions légales
//
// Structure réelle basée sur l'analyse du template :
// Pages 2-7 = slides events (1 page par moment)
// La page 7 = prestations additionnelles (slide index 6)
// Pages 8-17 = récapitulatifs par type d'événement (par paires)
//   8,9 = mariage ; 10,11 = anniversaire ; 12,13 = baptême ; 14,15 = séminaire ; 16,17 = réception
// Page 18 = infos entreprise
// Page 19 = légende (toujours supprimée)
// Page 20 = signature

const EVENT_PAGE_MAP: Record<string, { eventPages: number[]; recapPages: number[] }> = {
  "mariage":           { eventPages: [2, 3], recapPages: [8, 9] },
  "anniversaire":      { eventPages: [3, 4], recapPages: [10, 11] },
  "bapteme":           { eventPages: [4, 5], recapPages: [12, 13] },
  "baby shower":       { eventPages: [4, 5], recapPages: [12, 13] },
  "baptême":           { eventPages: [4, 5], recapPages: [12, 13] },
  "séminaire":         { eventPages: [5, 6], recapPages: [14, 15] },
  "seminaire":         { eventPages: [5, 6], recapPages: [14, 15] },
  "entreprise":        { eventPages: [5, 6], recapPages: [14, 15] },
  "réception":         { eventPages: [6, 7], recapPages: [16, 17] },
  "reception":         { eventPages: [6, 7], recapPages: [16, 17] },
  "réception privée":  { eventPages: [6, 7], recapPages: [16, 17] },
};

function matchEventPages(eventType: string): { eventPages: number[]; recapPages: number[] } {
  const e = eventType.toLowerCase().trim();
  for (const [k, v] of Object.entries(EVENT_PAGE_MAP)) {
    if (e.includes(k) || k.includes(e)) return v;
  }
  return { eventPages: [2, 3], recapPages: [8, 9] };
}

// ── Manipulations HTML ────────────────────────────────────────────────────────

// Remplace la première occurrence d'un texte dans un élément editable par classe
function replaceEditableByClass(html: string, cls: string, value: string, occurrence = 0): string {
  const pattern = new RegExp(`(<div[^>]*class="[^"]*${cls}[^"]*"[^>]*contenteditable="true"[^>]*>)[^<]*(</div>)`, "g");
  let count = 0;
  return html.replace(pattern, (_, open, close) => {
    if (count++ === occurrence) return `${open}${escHtml(value)}${close}`;
    return _;
  });
}

function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// Extrait les sections du HTML délimitées par data-page
function extractPages(html: string): Map<number, string> {
  const pages = new Map<number, string>();
  // Find all section elements with data-page
  const sectionPattern = /<section[^>]*data-page="(\d+)"[^>]*>([\s\S]*?)<\/section>/g;
  let match;
  while ((match = sectionPattern.exec(html)) !== null) {
    pages.set(parseInt(match[1]), match[0]);
  }
  return pages;
}

// Renumérote les pages dans les éléments .pn
function renumberPageNumbers(html: string, pageNum: number): string {
  return html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*contenteditable="true"[^>]*>)\d+(<\/span>)/, `$1${pageNum}$2`);
}

// ── Construction des lignes de plats ────────────────────────────────────────

function buildFoodRowsHtml(items: DevisItem[]): string {
  if (!items.length) return "";
  return items.map(item => {
    const icon = getFoodIcon(item.dishName);
    return `<div class="food-row">
      <span class="icon">${icon}</span>
      <div class="editable food-name">${escHtml(item.dishName)}</div>
      <div class="editable food-qty">${item.quantity} convives</div>
    </div>`;
  }).join("");
}

function getFoodIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("jus") || n.includes("bissap") || n.includes("cocktail") || n.includes("boisson") || n.includes("gingembre"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-martini" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>`;
  if (n.includes("gâteau") || n.includes("dessert") || n.includes("mignardise") || n.includes("mont") || n.includes("crème") || n.includes("mousse"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-cake-slice" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="2"/><path d="M7.2 1.5 8 5"/><path d="m14.8 1.5-1 3.5"/><path d="M2 10a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v12H2V10Z"/><path d="M2 15h20"/><path d="m4 15 4-5"/><path d="m14 10 4 5"/></svg>`;
  if (n.includes("café") || n.includes("infusion") || n.includes("thé") || n.includes("pause"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-coffee" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1Z"/><path d="M6 2v2"/><path d="M20 8h1a2 2 0 1 1 0 4h-1"/></svg>`;
  if (n.includes("poisson") || n.includes("filet") || n.includes("bar") || n.includes("tilapia") || n.includes("saumon"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-fish" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/><path d="M18 12v.5"/><path d="m16.5 10.5 1 1.5-1 1.5"/><path d="M2 7c1 1.5 2 3 2 5s-1 3.5-2 5"/><path d="M22 7c-1 1.5-2 3-2 5s1 3.5 2 5"/></svg>`;
  if (n.includes("légume") || n.includes("salade") || n.includes("verdure"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-salad" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-3.19 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/><path d="m13 12 4-4"/><path d="m5 8 1 8"/></svg>`;
  if (n.includes("soupe") || n.includes("velouté") || n.includes("bouillon"))
    return `<svg aria-hidden="true" focusable="false" class="lucide lucide-soup" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M7 21h10"/><path d="M19.5 12 22 6"/><path d="M16.25 3c.27.1.8.53.75 1.36-.06.83-.93 1.2-1 2.02-.07.82.49 1.41 1 1.62"/><path d="M11.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.82.49 1.41 1 1.62"/><path d="M6.25 3c.27.1.8.53.74 1.36-.05.83-.93 1.2-.98 2.02-.06.82.49 1.41 1 1.62"/></svg>`;
  return `<svg aria-hidden="true" focusable="false" class="lucide lucide-beef" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12.5" cy="8.5" r="2.5"/><path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z"/><path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"/></svg>`;
}

// ── Génération de la page de détail événement ─────────────────────────────────

function buildEventPageHtml(
  pageNum: number,
  eventType: string,
  guestCount: number,
  eventDate: string,
  location: string,
  sections: Section[],
  totalTTC: number,
): string {
  const sectionCards = sections.map(sec => {
    const rows = buildFoodRowsHtml(sec.items);
    const minHeight = Math.max(100, sec.items.length * 42 + 60);
    return `
    <div class="menu-card" style="min-height:${minHeight}px">
      <div class="card-head">
        <div class="card-section-name editable">${escHtml(sec.label)}</div>
        <div class="price-box">
          <div class="editable price-label">Sous-total HT</div>
          <div class="editable price-value">${fmtMoney(sec.subtotal)}</div>
        </div>
      </div>
      <div class="food-rows">
        ${rows}
      </div>
    </div>`;
  }).join("");

  return `<section class="page-host" data-page="${pageNum}">
  <article class="page event-page">
    <div class="page-band">
      <div class="editable page-event-type">${escHtml(eventType.toUpperCase())}</div>
      <div class="page-meta">
        <div><span class="icon"><svg aria-hidden="true" focusable="false" class="lucide lucide-users" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg></span><div class="editable meta-text">${guestCount} convives</div></div>
        <i></i>
        <div><span class="icon"><svg aria-hidden="true" focusable="false" class="lucide lucide-calendar-days" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg></span><div class="editable meta-text">${fmtDate(eventDate)}</div></div>
        <i></i>
        <div><span class="icon"><svg aria-hidden="true" focusable="false" class="lucide lucide-map-pin" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></span><div class="editable meta-text">${escHtml(location)}</div></div>
      </div>
    </div>
    <div class="menu-cards">
      ${sectionCards}
    </div>
    <div class="event-total">
      <div class="editable event-total-label">TOTAL TTC</div>
      <div class="editable event-total-value">${fmtMoney(totalTTC)}</div>
    </div>
  </article>
  <div class="page-number"><span class="editable pn">${pageNum}</span></div>
</section>`;
}

// ── Génération page prestations additionnelles ────────────────────────────────

function buildPrestationsPageHtml(pageNum: number, serviceItems: DevisItem[]): string {
  const hasServices = serviceItems.length > 0;
  const subtotal = serviceItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const servicesList = [
    { keywords: ["serveur","personnel","service & personnel"], label: "Service & personnel", desc: "Serveurs, maîtres d'hôtel" },
    { keywords: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel", desc: "Couverts, tables, chaises, marmites" },
    { keywords: ["livraison","transport"], label: "Livraison", desc: "Transport & livraison des plats" },
    { keywords: ["décoration","déco","floral"], label: "Décoration de table", desc: "Fleurs, bougies, centres de table" },
    { keywords: ["tente","chapiteau"], label: "Location de tente", desc: "Tentes & chapiteaux" },
    { keywords: ["animation","sono","musique","dj"], label: "Animation musicale", desc: "DJ, sonorisation, animation" },
    { keywords: ["gâteau","photographe","photo"], label: "Gâteau & photo", desc: "Pièce montée, reportage photo" },
  ];

  const slotRows = servicesList.map(slot => {
    const matched = serviceItems.find(i => slot.keywords.some(k => i.dishName.toLowerCase().includes(k)));
    const checked = matched !== undefined;
    const total = matched ? matched.quantity * matched.unitPrice : 0;
    const checkboxHtml = checked
      ? `<span class="checkbox checked" aria-label="sélectionné">✓</span>`
      : `<span class="checkbox unchecked" aria-label="non sélectionné">○</span>`;
    return `
    <div class="presta-slot ${checked ? "presta-checked" : "presta-unchecked"}">
      ${checkboxHtml}
      <div class="presta-info">
        <div class="presta-title">${checked ? escHtml(matched!.dishName) : escHtml(slot.label)}</div>
        <div class="presta-desc">${checked ? `${matched!.quantity} unité${matched!.quantity > 1 ? "s" : ""} — ${slot.desc}` : escHtml(slot.desc)}</div>
      </div>
      <div class="presta-price">${checked ? fmtMoney(total) : ""}</div>
    </div>`;
  }).join("");

  const noteText = hasServices
    ? "Prestations retenues pour cet événement"
    : "Aucune prestation additionnelle retenue pour cet événement.";

  return `<section class="page-host" data-page="${pageNum}">
  <article class="page presta-page">
    <div class="page-band">
      <div class="editable page-event-type">PRESTATIONS ADDITIONNELLES</div>
    </div>
    <div class="presta-note">${escHtml(noteText)}</div>
    <div class="presta-slots">
      ${slotRows}
    </div>
    <div class="presta-total-row">
      <div class="presta-total-label">SOUS-TOTAL PRESTATIONS</div>
      <div class="presta-total-value">${hasServices ? fmtMoney(subtotal) : "0 €"}</div>
    </div>
    <div class="presta-note-footer">
      Les prestations cochées sont incluses au présent devis et seront réalisées. Toute modification devra être validée avant exécution.
    </div>
  </article>
  <div class="page-number"><span class="editable pn">${pageNum}</span></div>
</section>`;
}

// ── Génération page récapitulatif ─────────────────────────────────────────────

function buildRecapPageHtml(
  pageNum: number,
  devis: Devis & { lieu?: string },
  sections: Section[],
  serviceItems: DevisItem[],
): string {
  const totalTraiteur = sections.reduce((s, x) => s + x.subtotal, 0);
  const totalServices = serviceItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const hasServices = serviceItems.length > 0;

  const sectionRows = sections.map((sec, i) => `
    <div class="recap-section">
      <div class="recap-num">${i + 1}</div>
      <div class="recap-section-label">${escHtml(sec.label)}</div>
      <div class="recap-section-price">${fmtMoney(sec.subtotal)}</div>
    </div>`).join("");

  const serviceRows = hasServices
    ? groupServicesByCategory(serviceItems).map(cat => `
    <div class="recap-extra">
      <div class="recap-extra-name">${escHtml(cat.label)}</div>
      <div class="recap-extra-detail">${escHtml(cat.desc)}</div>
      <div class="recap-extra-price">${fmtMoney(cat.total)}</div>
    </div>`).join("")
    : `<div class="recap-extra-none">Aucune prestation additionnelle n'a été sélectionnée.</div>`;

  return `<section class="page-host" data-page="${pageNum}">
  <article class="page recap-page">
    <div class="page-band">
      <div class="editable page-event-type">RÉCAPITULATIF</div>
    </div>
    <div class="recap-meta">
      <span class="icon"><svg aria-hidden="true" focusable="false" class="lucide lucide-users-round" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg></span>
      <div class="editable recap-meta-text">${devis.guestCount} convives</div>
      <i></i>
      <div class="editable recap-meta-date">${fmtDate(devis.eventDate)}</div>
    </div>

    <div class="editable section-kicker">PRESTATION TRAITEUR</div>
    <div class="recap-sections">
      ${sectionRows}
    </div>
    <div class="recap-subtotal-row">
      <div class="recap-subtotal-label">SOUS-TOTAL TRAITEUR</div>
      <div class="recap-subtotal-value">${fmtMoney(totalTraiteur)}</div>
    </div>

    <div class="editable extras-kicker">PRESTATIONS ADDITIONNELLES RETENUES</div>
    <div class="recap-extras">
      ${serviceRows}
    </div>
    <div class="recap-subtotal-row">
      <div class="recap-subtotal-label">SOUS-TOTAL PRESTATIONS ADDITIONNELLES</div>
      <div class="recap-subtotal-value">${hasServices ? fmtMoney(totalServices) : "0 €"}</div>
    </div>

    <div class="grand-total">
      <div class="editable grand-label">TOTAL TTC</div>
      <div class="editable grand-sub">${hasServices ? "Événement + prestations additionnelles" : "Prestation traiteur uniquement"}</div>
      <div class="editable grand-value">${fmtMoney(devis.totalTTC)}</div>
    </div>
  </article>
  <div class="page-number"><span class="editable pn">${pageNum}</span></div>
</section>`;
}

function groupServicesByCategory(items: DevisItem[]): { label: string; desc: string; total: number }[] {
  const cats = [
    { keywords: ["serveur","personnel","service & personnel"], label: "Service & personnel" },
    { keywords: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel" },
    { keywords: ["livraison","transport"], label: "Livraison" },
    { keywords: ["décoration","déco","floral"], label: "Décoration" },
    { keywords: ["tente","chapiteau"], label: "Location de tente" },
    { keywords: ["animation","sono","musique","dj"], label: "Animation musicale" },
    { keywords: ["gâteau","photographe","photo"], label: "Gâteau & photo" },
  ];
  const result: { label: string; desc: string; total: number }[] = [];
  for (const cat of cats) {
    const matched = items.filter(i => cat.keywords.some(k => i.dishName.toLowerCase().includes(k)));
    if (!matched.length) continue;
    result.push({
      label: cat.label,
      desc: matched.map(i => `${i.quantity} × ${i.dishName}`).join(", "),
      total: matched.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    });
  }
  // Services non catégorisés
  const categorized = result.flatMap(r => r.desc);
  const others = items.filter(i => !cats.some(c => c.keywords.some(k => i.dishName.toLowerCase().includes(k))));
  if (others.length) {
    result.push({
      label: "Autres prestations",
      desc: others.map(i => `${i.quantity} × ${i.dishName}`).join(", "),
      total: others.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    });
  }
  return result;
  void categorized;
}

// ── Génération page acompte ───────────────────────────────────────────────────

function buildAcomptePagesHtml(
  pageNumRecap: number,
  pageNumAcompte: number,
  devis: Devis & { lieu?: string },
  sections: Section[],
): string {
  const ttc = devis.totalTTC;
  const a30 = Math.round(ttc * 0.30);
  const a40 = Math.round(ttc * 0.40);
  const a30str = fmtMoney(a30);
  const a40str = fmtMoney(a40);

  return `<section class="page-host" data-page="${pageNumAcompte}">
  <article class="page acompte-page">
    <div class="page-band">
      <div class="editable page-event-type">ÉCHÉANCIER DE PAIEMENT</div>
    </div>
    <div class="acompte-summary">
      <div class="acompte-total-label">TOTAL TTC DE L'ÉVÉNEMENT</div>
      <div class="acompte-total-value">${fmtMoney(ttc)}</div>
    </div>
    <div class="payment-schedule">
      <div class="schedule-title">ÉCHÉANCIER DE PAIEMENT</div>
      <div class="schedule-rows">
        <div class="schedule-row">
          <div class="schedule-step">Acompte à la signature (30%)</div>
          <div class="schedule-amount">${a30str}</div>
        </div>
        <div class="schedule-row">
          <div class="schedule-step">Versement intermédiaire (40%)</div>
          <div class="schedule-amount">${a40str}</div>
        </div>
        <div class="schedule-row">
          <div class="schedule-step">Solde avant événement (30%)</div>
          <div class="schedule-amount">${a30str}</div>
        </div>
      </div>
    </div>
    <div class="payment-note">
      <span class="icon"><svg aria-hidden="true" focusable="false" class="lucide lucide-landmark" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg></span>
      <div>
        <div class="payment-note-strong">Échéancier calculé sur le total TTC, prestations additionnelles incluses.</div>
        <div class="payment-note-small">Paiement par virement bancaire ou espèces uniquement.</div>
      </div>
    </div>
  </article>
  <div class="page-number"><span class="editable pn">${pageNumAcompte}</span></div>
</section>`;
}

// ── Page signature ───────────────────────────────────────────────────────────

function buildSignaturePageHtml(pageNum: number, devis: Devis, now: string): string {
  return `<section class="page-host" data-page="${pageNum}">
  <article class="page signature-page">
    <div class="page-band">
      <div class="editable page-event-type">BON POUR ACCORD</div>
    </div>
    <div class="cgv-block">
      <div class="cgv-title">Conditions générales de vente</div>
      <ul class="cgv-list">
        <li>Devis valable 30 jours à compter du ${now}.</li>
        <li>Acompte de 30 % du TTC exigé à la signature pour confirmer la réservation.</li>
        <li>L'acompte est définitivement acquis en cas d'annulation par le client.</li>
        <li>Annulation &lt; 30 jours avant l'événement : la totalité du devis reste due.</li>
        <li>Solde exigible au plus tard 7 jours avant la date de la prestation.</li>
        <li>Tout litige fera l'objet d'une tentative de résolution amiable préalable.</li>
      </ul>
    </div>
    <div class="signature-boxes">
      <div class="sig-box">
        <div class="sig-title">Signature du client</div>
        <div class="sig-hint">Précédée de « Bon pour accord »</div>
        <div class="sig-area"></div>
        <div class="sig-name">${escHtml(devis.clientName)}</div>
      </div>
      <div class="sig-box">
        <div class="sig-title">Signature C.LC. Traiteur</div>
        <div class="sig-hint">Représentant(e) autorisé(e)</div>
        <div class="sig-area"></div>
        <div class="sig-name">Chez La Camerounaise</div>
      </div>
    </div>
    <div class="fait-a">
      Fait à Rouen, le ${now}
    </div>
  </article>
  <div class="page-number"><span class="editable pn">${pageNum}</span></div>
</section>`;
}

// ── Rebuild de la page cover depuis le template ──────────────────────────────

function buildCoverHtml(templateCoverPage: string, devis: Devis & { lieu?: string }, now: string): string {
  let html = templateCoverPage;
  // Replace all contenteditable values
  html = replaceEditableByClass(html, "cover-value", devis.clientName, 0); // Client
  html = replaceEditableByClass(html, "cover-value", fmtDate(devis.eventDate), 1); // Date
  html = replaceEditableByClass(html, "cover-value", devis.eventType, 2); // Événement
  html = replaceEditableByClass(html, "cover-value", devis.lieu ?? "Rouen, France", 3); // Lieu
  html = replaceEditableByClass(html, "cover-value", devis.clientPhone ?? "", 4); // Contact
  html = replaceEditableByClass(html, "cover-value", devis.id, 5); // N° Devis
  return html;
}

// ── Reconstruction de la page infos entreprise ───────────────────────────────

function buildInfosHtml(templateInfosPage: string, devis: Devis, now: string): string {
  // La page 18 (infos entreprise) reste quasi-identique au template
  // On renumérote juste la page
  return templateInfosPage;
}

// ── CSS supplémentaire pour les pages générées ──────────────────────────────

const EXTRA_CSS = `
/* ── Pages générées dynamiquement ────────────────────────────────────────── */
.event-page .page-band,.recap-page .page-band,.presta-page .page-band,
.acompte-page .page-band,.signature-page .page-band {
  background:var(--dark); color:white; padding:14px 24px 12px;
  border-bottom:3px solid var(--gold);
}
.page-band .page-event-type { font-size:18px; font-weight:700; letter-spacing:.08em; }
.page-meta { display:flex; align-items:center; gap:12px; margin-top:6px; font-size:11px; color:var(--tan); }
.page-meta i { width:1px; height:14px; background:var(--gold2); opacity:.5; }
.page-meta .icon svg { width:14px; height:14px; vertical-align:middle; margin-right:4px; }
.menu-cards { padding:16px 24px; display:flex; flex-direction:column; gap:14px; }
.menu-card { border:1px solid var(--tan); border-radius:8px; overflow:hidden; }
.card-head { background:var(--green); color:white; padding:8px 14px; display:flex; justify-content:space-between; align-items:center; }
.card-section-name { font-weight:700; font-size:13px; letter-spacing:.05em; }
.price-box { text-align:right; }
.price-label { font-size:9px; opacity:.7; }
.price-value { font-weight:700; font-size:13px; color:var(--gold2); }
.food-rows { padding:4px 0; }
.food-row { display:flex; align-items:center; gap:10px; padding:5px 14px; border-bottom:1px solid var(--tan); }
.food-row:last-child { border-bottom:none; }
.food-row .icon svg { width:16px; height:16px; color:var(--gold); flex-shrink:0; }
.food-name { flex:1; font-size:11px; color:var(--ink); }
.food-qty { font-size:10px; color:var(--muted); white-space:nowrap; }
.event-total { background:var(--dark); color:white; padding:10px 24px; margin-top:auto;
  display:flex; justify-content:space-between; align-items:center; }
.event-total-label { font-size:11px; letter-spacing:.06em; opacity:.8; }
.event-total-value { font-size:18px; font-weight:700; color:var(--gold2); }

/* Prestations */
.presta-note { padding:10px 24px; font-size:11px; color:var(--muted); font-style:italic; }
.presta-slots { padding:8px 24px; display:flex; flex-direction:column; gap:8px; }
.presta-slot { display:flex; align-items:center; gap:12px; padding:8px 12px; border-radius:6px; border:1px solid var(--tan); }
.presta-checked { border-color:var(--gold); background:var(--ivory2); }
.presta-unchecked { opacity:.55; }
.checkbox { font-size:16px; width:22px; text-align:center; }
.checkbox.checked { color:var(--green); font-weight:700; }
.checkbox.unchecked { color:var(--muted); }
.presta-info { flex:1; }
.presta-title { font-weight:600; font-size:11px; color:var(--ink); }
.presta-desc { font-size:10px; color:var(--muted); }
.presta-price { font-weight:700; font-size:12px; color:var(--green); white-space:nowrap; }
.presta-total-row { display:flex; justify-content:space-between; margin:12px 24px; padding:10px 14px;
  background:var(--dark); color:white; border-radius:6px; }
.presta-total-label { font-size:10px; letter-spacing:.06em; }
.presta-total-value { font-weight:700; font-size:15px; color:var(--gold2); }
.presta-note-footer { padding:0 24px 12px; font-size:9.5px; color:var(--muted); font-style:italic; }

/* Récapitulatif */
.recap-meta { display:flex; align-items:center; gap:12px; padding:10px 24px; background:var(--ivory); font-size:11px; color:var(--ink); }
.recap-meta i { width:1px; height:14px; background:var(--gold2); opacity:.5; }
.section-kicker,.extras-kicker { padding:8px 24px 4px; font-size:10px; font-weight:700; letter-spacing:.1em; color:var(--muted); }
.recap-sections,.recap-extras { padding:0 24px; }
.recap-section,.recap-extra { display:flex; align-items:center; gap:10px; padding:5px 0;
  border-bottom:1px solid var(--tan); font-size:11px; }
.recap-section:last-child,.recap-extra:last-child { border-bottom:none; }
.recap-num { width:20px; height:20px; border-radius:50%; background:var(--green); color:white;
  display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
.recap-section-label,.recap-extra-name { flex:1; color:var(--ink); font-weight:500; }
.recap-extra-detail { flex:2; color:var(--muted); font-size:10px; }
.recap-section-price,.recap-extra-price { font-weight:700; color:var(--green); }
.recap-extra-none { padding:10px 0; color:var(--muted); font-style:italic; font-size:11px; }
.recap-subtotal-row { display:flex; justify-content:space-between; margin:8px 24px; padding:6px 12px;
  background:var(--ivory); border:1px solid var(--tan); border-radius:4px; font-size:11px; }
.recap-subtotal-label { color:var(--muted); font-weight:500; }
.recap-subtotal-value { font-weight:700; color:var(--ink); }
.grand-total { margin:12px 24px; padding:12px 16px; background:var(--dark); color:white; border-radius:8px; }
.grand-label { font-size:10px; letter-spacing:.08em; opacity:.7; }
.grand-sub { font-size:10px; opacity:.55; margin:2px 0; }
.grand-value { font-size:22px; font-weight:700; color:var(--gold2); }

/* Acompte */
.acompte-summary { padding:16px 24px; display:flex; justify-content:space-between; align-items:center;
  background:var(--ivory); border-bottom:1px solid var(--tan); }
.acompte-total-label { font-size:10px; font-weight:700; letter-spacing:.08em; color:var(--muted); }
.acompte-total-value { font-size:20px; font-weight:700; color:var(--green); }
.payment-schedule { padding:16px 24px; }
.schedule-title { font-size:11px; font-weight:700; letter-spacing:.06em; color:var(--ink); margin-bottom:10px; }
.schedule-rows { display:flex; flex-direction:column; gap:6px; }
.schedule-row { display:flex; justify-content:space-between; padding:8px 12px;
  background:var(--ivory2); border:1px solid var(--tan); border-radius:6px; }
.schedule-step { font-size:11px; color:var(--ink); }
.schedule-amount { font-weight:700; color:var(--green); font-size:12px; }
.payment-note { display:flex; align-items:flex-start; gap:10px; padding:12px 24px;
  background:var(--ivory); border-top:1px solid var(--tan); }
.payment-note .icon svg { width:18px; height:18px; color:var(--gold); margin-top:2px; }
.payment-note-strong { font-size:10.5px; font-weight:600; color:var(--ink); }
.payment-note-small { font-size:9.5px; color:var(--muted); margin-top:3px; }

/* Signature */
.cgv-block { padding:18px 24px; }
.cgv-title { font-size:13px; font-weight:700; color:var(--dark); margin-bottom:6px; }
.cgv-list { margin:0; padding-left:18px; list-style:disc; }
.cgv-list li { font-size:10px; color:var(--muted); line-height:1.7; }
.signature-boxes { display:flex; gap:16px; padding:16px 24px; }
.sig-box { flex:1; border:1px solid var(--tan); border-radius:8px; padding:12px; background:var(--ivory2); }
.sig-title { font-size:11px; font-weight:700; color:var(--dark); }
.sig-hint { font-size:9px; color:var(--muted); font-style:italic; margin:3px 0 8px; }
.sig-area { height:56px; border:1px dashed var(--gold); border-radius:4px; margin-bottom:8px; }
.sig-name { font-size:10px; color:var(--muted); }
.fait-a { text-align:center; font-size:11px; color:var(--muted); padding:14px 0 8px; font-style:italic; }
`;

// ── API Route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Devis & { lieu?: string };

    const serviceItems = body.items.filter(i => isService(i.dishName));
    const dishItems    = body.items.filter(i => !isService(i.dishName));
    const sections     = groupSections(dishItems);
    const hasServices  = serviceItems.length > 0;

    const now = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Lire le template HTML
    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");

    // Extraire les pages du template
    const pages = extractPages(templateHtml);

    // Récupérer le style + head du template
    const headMatch = templateHtml.match(/^[\s\S]*?<\/style>/);
    const headHtml  = headMatch ? headMatch[0] : "";

    // Page 1 : Cover (reconstruire depuis template)
    const coverPage = pages.get(1) ?? "";
    const builtCover = buildCoverHtml(coverPage, body, now);

    // Pages event : construire depuis nos données
    const totalTTC = body.totalTTC;

    // Regrouper les sections par paires pour les pages event (max 3 sections par page)
    const sectionChunks: Section[][] = [];
    for (let i = 0; i < Math.max(1, sections.length); i += 3) {
      sectionChunks.push(sections.slice(i, i + 3));
    }
    if (sectionChunks.length === 0) sectionChunks.push([]);

    // Page de prestations (page 7 du template)
    const prestationsPage = buildPrestationsPageHtml(0, serviceItems);

    // Pages de détail événement
    const eventDetailPages = sectionChunks.map((chunk, ci) =>
      buildEventPageHtml(0, body.eventType, body.guestCount, body.eventDate, body.lieu ?? "Rouen, France", chunk, ci === 0 ? totalTTC : chunk.reduce((s, sec) => s + sec.subtotal * 1.2, 0))
    );

    // Page récap
    const recapPage = buildRecapPageHtml(0, body, sections, serviceItems);

    // Page acompte
    const acomptePage = buildAcomptePagesHtml(0, 0, body, sections);

    // Page infos (page 18 du template)
    const infosPage  = buildInfosHtml(pages.get(18) ?? "", body, now);

    // Page signature (page 20 du template — on utilise notre générateur)
    const sigPage = buildSignaturePageHtml(0, body, now);

    // Assembler toutes les pages dans l'ordre
    const allPages = [
      builtCover,
      ...eventDetailPages,
      prestationsPage,
      recapPage,
      acomptePage,
      infosPage,
      sigPage,
    ];

    // Renuméroter les pages
    const numberedPages = allPages.map((p, i) =>
      p.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*contenteditable="true"[^>]*>)\d*(<\/span>)/, `$1${i + 1}$2`)
       .replace(/data-page="\d+"/, `data-page="${i + 1}"`)
    );

    const totalPages = numberedPages.length;

    // Injecter le CSS supplémentaire dans le head
    const enrichedHead = headHtml.replace("</style>", EXTRA_CSS + "</style>");

    // Construction HTML final
    const finalHtml = `${enrichedHead}
</head>
<body>
<style>
  /* Override toolbar pour l'impression */
  .toolbar { display:none !important; }
  @media print {
    .page-host { display:block !important; page-break-after:always; }
    .page-host:last-child { page-break-after:avoid; }
  }
</style>
<main>
${numberedPages.join("\n")}
</main>
<!-- Footer pages -->
<script>
(function() {
  // Inject footer on each page
  var pages = document.querySelectorAll('.page');
  var total = ${totalPages};
  pages.forEach(function(p, i) {
    var footer = document.createElement('div');
    footer.style.cssText = 'position:absolute;bottom:6mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#6C6A62;border-top:1px solid #D9CEBF;padding-top:3px;';
    footer.innerHTML = '<span>C.LC. Traiteur — SIRET : 123 456 789 00012 — contact@clctraiteur.fr — Rouen</span><span>Devis ${escHtml(body.id)} · Page ' + (i+1) + '/' + total + '</span>';
    p.style.position = 'relative';
    p.appendChild(footer);
  });
  // Auto print
  window.onload = function() { window.print(); };
})();
</script>
</body>
</html>`;

    return new NextResponse(finalHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${body.id}.html"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pdf]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
