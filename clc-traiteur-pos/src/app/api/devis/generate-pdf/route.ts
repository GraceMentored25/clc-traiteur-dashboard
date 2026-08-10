export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { Devis, DevisItem } from "@/lib/types";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "devis_modele.html");

const MOIS = ["","janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];
function fmtDate(iso: string): string {
  try { const [y,m,d] = iso.split("-"); return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`; }
  catch { return iso; }
}
function fmtMoney(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}
function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Groupement sections ──────────────────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }
function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string, DevisItem[]>();
  for (const it of items) {
    const k = it.section ?? "Prestation";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(it);
  }
  return [...map.entries()].map(([label, its]) => ({
    label, items: its, subtotal: its.reduce((s,i) => s + i.quantity * i.unitPrice, 0),
  }));
}

function isService(name: string): boolean {
  const n = name.toLowerCase();
  return ["serveur","marmite","service de table","tente","chapiteau","chaise",
          "déco","décoration","transport","livraison","sono","animation","photographe"]
    .some(k => n.includes(k));
}

// ── Mapping événement → pages template ──────────────────────────────────────
// event pages 2-6 (one per event type), prestations=7, recap/acompte pairs 8-17
const EVENT_PAGES: Record<string, { ev: number; recap: number; acompte: number }> = {
  "mariage":    { ev:2,  recap:8,  acompte:9  },
  "anniversaire":{ ev:3, recap:10, acompte:11 },
  "bapteme":    { ev:4,  recap:12, acompte:13 },
  "baby shower":{ ev:4,  recap:12, acompte:13 },
  "baptême":    { ev:4,  recap:12, acompte:13 },
  "séminaire":  { ev:5,  recap:14, acompte:15 },
  "seminaire":  { ev:5,  recap:14, acompte:15 },
  "entreprise": { ev:5,  recap:14, acompte:15 },
  "réception":  { ev:6,  recap:16, acompte:17 },
  "reception":  { ev:6,  recap:16, acompte:17 },
};
function getEventPages(eventType: string) {
  const e = eventType.toLowerCase().trim();
  for (const [k,v] of Object.entries(EVENT_PAGES))
    if (e.includes(k) || k.includes(e)) return v;
  return { ev:2, recap:8, acompte:9 };
}

// ── Extraction d'une page du template ───────────────────────────────────────
function getPage(html: string, n: number): string {
  const start = html.indexOf(`<section class="page-host" data-page="${n}"`);
  if (start < 0) return "";
  const end = html.indexOf(`<section class="page-host" data-page="${n+1}"`);
  return end > start ? html.slice(start, end) : html.slice(start);
}

// ── Remplacement ciblé d'un contenteditable par classe ──────────────────────
// Remplace la Nème occurrence d'un élément avec cette classe CSS
function setField(html: string, cls: string, value: string, nth = 0): string {
  // Matches any tag that has the class (including compound classes like "editable recap-event")
  const re = new RegExp(
    `(<(?:div|span)[^>]*class="[^"]*(?:^|\\s)${cls.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?:\\s|")[^>]*>)[^<]*(</(?:div|span)>)`,
    "g"
  );
  let count = 0;
  return html.replace(re, (_, open, close) => {
    if (count++ === nth) return `${open}${value}${close}`;
    return _;
  });
}

// Remplace toutes les occurrences
function setAllFields(html: string, cls: string, value: string): string {
  const re = new RegExp(
    `(<(?:div|span)[^>]*class="[^"]*(?:^|\\s)${cls.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?:\\s|")[^>]*>)[^<]*(</(?:div|span)>)`,
    "g"
  );
  return html.replace(re, (_, open, close) => `${open}${value}${close}`);
}

// ── Icône SVG générique du template ─────────────────────────────────────────
const FOOD_ICON = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M3 10v2h2v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h2v-2zm4 2h10v7H7z"/></svg>`;

// ── Construction d'un food-row avec la structure exacte du template ──────────
function foodRow(name: string, qty: number): string {
  return `<div class="food-row"><span class="icon menu-ico">${FOOD_ICON}</span>`
    + `<div class="editable food-name" contenteditable="true" spellcheck="false">${esc(name)}</div>`
    + `<div class="editable food-qty" contenteditable="true" spellcheck="false">${qty} convives</div></div>`;
}

// ── Reconstruction de la page event ─────────────────────────────────────────
// Stratégie : garder la page template telle quelle (images, css, header),
// remplacer event-title, meta-text, puis supprimer/réécrire les menu-cards
function buildEventPage(templatePage: string, devis: Devis & {lieu?:string}, sections: Section[], totalTTC: number, outPageNum: number, sectionOffset = 0, showTotal = true): string {
  let h = templatePage;

  // Numéro de page affiché
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${outPageNum}$2`);

  // Titre événement
  h = setField(h, "event-title", esc(devis.eventType.toUpperCase()));

  // Meta-bar (3 valeurs dans l'ordre: convives, date, lieu)
  const metaVals = [`${devis.guestCount} convives`, fmtDate(devis.eventDate), esc(devis.lieu ?? "Rouen, France")];
  let mi = 0;
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bmeta-text\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${metaVals[mi++] ?? ""}${close}`
  );

  // La meta se ferme juste avant le premier <div class="menu-card"
  // Ce marqueur est fiable : la structure est toujours </div></div></div><div class="menu-card"
  const firstCard = h.indexOf('<div class="menu-card"');
  const metaEnd   = firstCard > 0 ? firstCard : -1;

  const articleEnd = h.lastIndexOf('</article>');
  if (metaEnd > 0 && articleEnd > metaEnd) {
    const before = h.slice(0, metaEnd);
    const after  = h.slice(articleEnd);

    // Extraire les card-heads du template (pour réutiliser photos)
    const origCards: string[] = [];
    let pos = metaEnd;
    while (true) {
      const cs = h.indexOf('<div class="menu-card"', pos);
      if (cs < 0 || cs >= articleEnd) break;
      const ce = h.indexOf('<div class="menu-card"', cs + 100);
      origCards.push(h.slice(cs, ce > cs && ce < articleEnd ? ce : articleEnd));
      pos = cs + 100;
    }

    // Reconstruire les cards
    // Hauteur: card-head=78px + food-list starts at 88px + rows*33px + 10px bottom
    const CARD_TOP_FIRST = 235;
    const CARD_GAP = 15;
    let currentTop = CARD_TOP_FIRST;

    const cardsHtml = sections.map((sec, i) => {
      const nRows   = sec.items.length;
      const height  = 78 + 10 + nRows * 33 + 12;

      // Card-head : réutiliser l'image de la card template si disponible
      const tmplCard = origCards[i] ?? origCards[0] ?? "";
      const chStart  = tmplCard.indexOf('<div class="card-head">');
      const chEnd    = tmplCard.indexOf('<div class="food-list">');
      const sectionNum = sectionOffset + i + 1;
      let cardHead: string;
      if (chStart >= 0 && chEnd > chStart) {
        cardHead = tmplCard.slice(chStart, chEnd);
        cardHead = cardHead.replace(
          /(<div[^>]*class="[^"]*\bcard-title\b[^"]*"[^>]*>)[^<]*(<\/div>)/,
          `$1${sectionNum}. ${esc(sec.label)}$2`
        );
        cardHead = cardHead.replace(
          /(<div[^>]*class="[^"]*\bcard-sub\b[^"]*"[^>]*>)[^<]*(<\/div>)/, `$1$2`
        );
        cardHead = cardHead.replace(
          /(<div[^>]*class="[^"]*\bprice-value\b[^"]*"[^>]*>)[^<]*(<\/div>)/,
          `$1${fmtMoney(sec.subtotal)}$2`
        );
      } else {
        cardHead = `<div class="card-head"><div class="card-head-gradient"></div>`
          + `<div class="editable card-title">${sectionNum}. ${esc(sec.label)}</div>`
          + `<div class="price-box"><div class="editable price-label">Sous-total</div>`
          + `<div class="editable price-value">${fmtMoney(sec.subtotal)}</div></div></div>`;
      }

      const rows = sec.items.map(it => foodRow(it.dishName, it.quantity)).join("");
      const card = `<div class="menu-card" style="top:${currentTop}px;height:${height}px">`
        + cardHead
        + `<div class="food-list">${rows}</div></div>`;

      currentTop += height + CARD_GAP;
      return card;
    }).join("");

    const totalTop = currentTop + 8;
    const evTotal  = showTotal
      ? `<div class="event-total" style="top:${totalTop}px">`
        + `<div class="editable event-total-label">TOTAL TTC</div>`
        + `<div class="editable event-total-value">${fmtMoney(totalTTC)}</div></div>`
      : "";

    h = before + cardsHtml + evTotal + after;
  }

  return h;
}

// ── Reconstruction page prestations (page 7) ─────────────────────────────────
// Le template a 7 service-row avec service-name / service-detail / service-price
// + note-text + additional-total-value
function buildPrestationsPage(templatePage: string, serviceItems: DevisItem[], outPageNum: number): string {
  let h = templatePage;
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${outPageNum}$2`);

  const SLOTS = [
    { keys: ["serveur","personnel"],          label: "Service & personnel",  desc: "Serveurs, maîtres d'hôtel" },
    { keys: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel", desc: "Couverts, tables, chaises, marmites" },
    { keys: ["livraison","transport"],         label: "Livraison",             desc: "Transport & livraison des plats" },
    { keys: ["décoration","déco","floral"],    label: "Décoration de table",   desc: "Fleurs, bougies, centres de table" },
    { keys: ["tente","chapiteau"],             label: "Location de tente",     desc: "Tentes & chapiteaux" },
    { keys: ["animation","sono","musique","dj"], label: "Animation musicale", desc: "DJ, sonorisation, animation" },
    { keys: ["gâteau","photographe","photo"],  label: "Gâteau & photo",        desc: "Pièce montée, reportage photo" },
  ];

  const hasServices = serviceItems.length > 0;
  const subtotal = serviceItems.reduce((s,i) => s + i.quantity * i.unitPrice, 0);

  // Remplacer la note
  h = setField(h, "additional-sub",
    hasServices
      ? "Prestations retenues pour cet événement"
      : "Aucune prestation additionnelle n'a été sélectionnée."
  );
  h = setField(h, "note-text",
    "Seules les prestations cochées sont incluses au présent devis et seront réalisées par le traiteur, celles non cochées restent à la charge du client."
  );
  h = setField(h, "additional-total-value", hasServices ? fmtMoney(subtotal) : "0 €");

  // Pour chaque slot : remplacer name / detail / price + gérer checkbox
  const slotData = SLOTS.map(slot => {
    const matched = serviceItems.find(i => slot.keys.some(k => i.dishName.toLowerCase().includes(k)));
    return matched
      ? { name: esc(matched.dishName), detail: `${matched.quantity} unité${matched.quantity>1?"s":""}`, price: fmtMoney(matched.quantity * matched.unitPrice), checked: true }
      : { name: esc(slot.label), detail: esc(slot.desc), price: "", checked: false };
  });

  // Checkboxes : retirer checked sur les slots non sélectionnés
  // Chaque service-check correspond à un slot dans l'ordre du template
  let checkIdx = 0;
  h = h.replace(/<input[^>]*class="[^"]*\bservice-check\b[^"]*"[^>]*>/g, (full) => {
    const slot = slotData[checkIdx++];
    if (!slot) return full;
    if (slot.checked) return full; // garder checked
    // Retirer l'attribut checked
    return full.replace(/\s+checked\b/g, "");
  });

  let nameIdx = 0, detailIdx = 0, priceIdx = 0;
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bservice-name\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${slotData[nameIdx++]?.name ?? ""}${close}`
  );
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bservice-detail\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${slotData[detailIdx++]?.detail ?? ""}${close}`
  );
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bservice-price\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${slotData[priceIdx++]?.price ?? ""}${close}`
  );

  return h;
}

// ── Reconstruction page récap (pages 8,10,12,14,16) ─────────────────────────
// Champs: recap-event, recap-meta-text, recap-meta-date, recap-meta-place,
//   recap-name(×3), recap-sub(×3), recap-price(×3),
//   recap-event-total-value,
//   extra-name(×3), extra-detail(×3), extra-price(×3),
//   recap-extra-total-value, grand-value, grand-sub
function buildRecapPage(templatePage: string, devis: Devis & {lieu?:string}, sections: Section[], serviceItems: DevisItem[], outPageNum: number): string {
  let h = templatePage;
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${outPageNum}$2`);

  const totalTraiteur  = sections.reduce((s,x) => s + x.subtotal, 0);
  const totalServices  = serviceItems.reduce((s,i) => s + i.quantity * i.unitPrice, 0);
  const hasServices    = serviceItems.length > 0;
  const totalTTC       = devis.totalTTC;

  // En-tête
  h = setField(h, "recap-event",      esc(devis.eventType.toUpperCase()));
  h = setField(h, "recap-meta-text",  `${devis.guestCount} convives`);
  h = setField(h, "recap-meta-date",  fmtDate(devis.eventDate));
  h = setField(h, "recap-meta-place", esc(devis.lieu ?? "Rouen, France"));

  // Lignes sections (max 3 dans le template)
  let nameI = 0, subI = 0, priceI = 0;
  const recapRows = Array.from({length: 3}, (_, i) => sections[i] ?? null);

  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\brecap-name\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${recapRows[nameI++]?.label ? esc(recapRows[nameI-1]!.label) : ""}${close}`
  );
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\brecap-sub\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${recapRows[subI++] ? "" : ""}${close}`
  );
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\brecap-price\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${recapRows[priceI] ? fmtMoney(recapRows[priceI++]!.subtotal) : (priceI++ && "")}${close}`
  );

  h = setField(h, "recap-event-total-value", fmtMoney(totalTraiteur));

  // ── Prestations additionnelles : reconstruire le bloc recap-extras ───────────
  // On extrait les recap-extra du template pour réutiliser leur structure (icônes SVG)
  // puis on ne garde que ceux qui ont des données
  const SERV_CATS = [
    { keys: ["serveur","personnel"],            label: "Service & personnel" },
    { keys: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel" },
    { keys: ["livraison","transport"],          label: "Livraison" },
    { keys: ["décoration","déco","floral"],     label: "Décoration" },
    { keys: ["tente","chapiteau"],              label: "Location de tente" },
    { keys: ["animation","sono","musique","dj"],label: "Animation musicale" },
    { keys: ["gâteau","photographe","photo"],   label: "Gâteau & photo" },
  ];

  // Calculer les données des extras sélectionnés
  const extrasData: {label:string; detail:string; total:number}[] = [];
  if (hasServices) {
    for (const cat of SERV_CATS) {
      const its = serviceItems.filter(i => cat.keys.some(k => i.dishName.toLowerCase().includes(k)));
      if (its.length) extrasData.push({
        label:  cat.label,
        detail: its.map(i => `${i.quantity} × ${i.dishName}`).join(", "),
        total:  its.reduce((s,i) => s + i.quantity * i.unitPrice, 0),
      });
    }
    const others = serviceItems.filter(i => !SERV_CATS.some(c => c.keys.some(k => i.dishName.toLowerCase().includes(k))));
    if (others.length) extrasData.push({
      label:  "Autres prestations",
      detail: others.map(i => i.dishName).join(", "),
      total:  others.reduce((s,i) => s + i.quantity * i.unitPrice, 0),
    });
  }

  // Extraire les N blocs recap-extra du template (pour leurs icônes SVG)
  const tmplExtras: string[] = [];
  {
    let pos = 0;
    while (true) {
      const s = h.indexOf('<div class="recap-extra">', pos);
      if (s < 0) break;
      const e = h.indexOf('<div class="recap-extra">', s + 10);
      // Fin : prochain recap-extra ou fermeture de recap-extras
      const closingBlock = h.indexOf('</div>', h.indexOf('recap-extra-total') > 0 ? h.indexOf('recap-extra-total') - 50 : s + 200);
      const end = (e > 0 && e < closingBlock) ? e : closingBlock + 6;
      tmplExtras.push(h.slice(s, end));
      pos = s + 10;
    }
  }

  // Reconstruire le bloc recap-extras : remplacer tout le <div class="recap-extras">…</div>
  const extrasBlockStart = h.indexOf('<div class="recap-extras">');
  const totalLabelPos    = h.indexOf('recap-extra-total-label');
  const extrasBlockEnd   = h.lastIndexOf('</div>', totalLabelPos) + 6;

  if (extrasBlockStart > 0 && extrasBlockEnd > extrasBlockStart) {
    let newExtras: string;

    if (extrasData.length === 0) {
      // Aucun service : texte full-width, sans icône, sans colonne prix
      newExtras = `<div class="recap-extras">`
        + `<div class="recap-extra" style="display:block;height:auto;padding:12px 0;">`
        + `<div class="editable extra-name" style="font-weight:400;font-size:16px;color:var(--muted);font-family:Raleway,Arial,sans-serif;">Aucune prestation n'a été sélectionnée.</div>`
        + `</div></div>`;
    } else {
      const rows = extrasData.map((data, i) => {
        // Réutiliser l'icône SVG du bloc template correspondant (ou le dernier disponible)
        const tmpl = tmplExtras[Math.min(i, tmplExtras.length - 1)] ?? "";
        // Extraire l'icône (<span class="icon">…</span>)
        const iconEnd   = tmpl.indexOf('</span>') + 7;
        const iconBlock = iconEnd > 6 ? tmpl.slice(0, iconEnd) : "";
        return `<div class="recap-extra">${iconBlock}`
          + `<div><div class="editable extra-name">${esc(data.label)}</div>`
          + `<div class="editable extra-detail">${esc(data.detail)}</div></div>`
          + `<div class="editable extra-price">${fmtMoney(data.total)}</div></div>`;
      });
      newExtras = `<div class="recap-extras">${rows.join("")}</div>`;
    }

    h = h.slice(0, extrasBlockStart) + newExtras + h.slice(extrasBlockEnd);
  }

  h = setField(h, "recap-extra-total-value", hasServices ? fmtMoney(totalServices) : "0 €");
  h = setField(h, "grand-value", fmtMoney(totalTTC));
  h = setField(h, "grand-sub",   hasServices ? "Événement + prestations additionnelles" : "Prestation traiteur uniquement");

  return h;
}

// ── Reconstruction page acompte (pages 9,11,13,15,17) ───────────────────────
// Champs: payment-event, summary-total, summary-breakdown(×2),
//   deposit-amount, payment-amount(×3)
function buildAcomptePage(templatePage: string, devis: Devis, sections: Section[], outPageNum: number): string {
  let h = templatePage;
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${outPageNum}$2`);

  const ttc         = devis.totalTTC;
  const totalEv     = sections.reduce((s,x) => s + x.subtotal, 0);
  const totalSvc    = ttc - totalEv;
  const hasSvc      = totalSvc > 0;
  const a30 = Math.round(ttc * 0.30);
  const a40 = Math.round(ttc * 0.40);

  h = setField(h, "payment-event",   esc(devis.eventType.toUpperCase()));
  h = setField(h, "summary-total",   fmtMoney(ttc));
  h = setField(h, "summary-breakdown", fmtMoney(totalEv) + "  événement", 0);
  h = setField(h, "summary-breakdown", hasSvc ? `+ ${fmtMoney(totalSvc)}  prestations additionnelles` : "", 1);
  h = setField(h, "deposit-amount",  fmtMoney(a30));

  // 3 lignes de paiement : 30%, 40%, 30%
  let pai = 0;
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bpayment-amount\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => {
      const v = pai === 0 ? fmtMoney(a30) : pai === 1 ? fmtMoney(a40) : fmtMoney(a30);
      pai++;
      return `${open}${v}${close}`;
    }
  );

  return h;
}

// ── Reconstruction cover ──────────────────────────────────────────────────────
function buildCover(templatePage: string, devis: Devis & {lieu?:string}, now: string): string {
  let h = templatePage;
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$11$2`);
  // cover-value dans l'ordre du template: Client, Date, Événement, Lieu, Contact, N° Devis
  const vals = [
    esc(devis.clientName),
    fmtDate(devis.eventDate),
    esc(devis.eventType),
    esc(devis.lieu ?? "Rouen, France"),
    esc(devis.clientPhone ?? ""),
    esc(devis.id),
  ];
  let vi = 0;
  h = h.replace(
    /(<(?:div|span)[^>]*class="[^"]*\bcover-value\b[^"]*"[^>]*>)[^<]*(<\/(?:div|span)>)/g,
    (_, open, close) => `${open}${vals[vi++] ?? ""}${close}`
  );
  void now;
  return h;
}

// ── Reconstruction dernière page (signature / mentions) ──────────────────────
function buildSignaturePage(templatePage: string, devis: Devis, now: string, outPageNum: number): string {
  let h = templatePage;
  h = h.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${outPageNum}$2`);
  h = setField(h, "sig-client", esc(devis.clientName));
  h = setField(h, "fait-a-date", `Fait à Rouen, le ${now}`);
  // Remplacer le div.editable (sans classe supplémentaire) qui contient le lieu en bas de page
  h = h.replace(
    /(<div[^>]*class="editable\s*"[^>]*contenteditable="true"[^>]*>)[^<]*(<\/div>)/,
    `$1Rouen, France$2`
  );
  return h;
}

// ── CSS d'impression ─────────────────────────────────────────────────────────
const PRINT_CSS = `<style id="print-overrides">
  .toolbar,.page-number { display:none !important; }
  @media screen {
    body { padding:24px; background:#1a1a1a; }
    .page-host {
      display:block !important;
      margin:0 auto 24px;
      box-shadow:0 4px 32px rgba(0,0,0,.6);
      border-radius:2px;
    }
  }
  @media print {
    @page { size:A4; margin:0; }
    body { padding:0; background:white; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .page-host {
      display:block !important;
      width:210mm; height:297mm;
      margin:0; page-break-after:always;
      box-shadow:none;
    }
    .page-host:last-child { page-break-after:avoid; }
    .page { transform:none !important; width:210mm; height:297mm; }
    img { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>`;

// ── API Route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };

    const serviceItems = devis.items.filter(i => isService(i.dishName));
    const dishItems    = devis.items.filter(i => !isService(i.dishName));
    const sections     = groupSections(dishItems);
    const cfg          = getEventPages(devis.eventType);

    const now = new Date().toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });

    // UTF-8 : le template est encodé en UTF-8, les base64 ne contiennent que des chars ASCII
    const html = fs.readFileSync(TEMPLATE_PATH, "utf-8");

    // ── Head (CSS, fonts, etc.) ──────────────────────────────────────────────
    const bodyIdx = html.indexOf("<body");
    let head = html.slice(0, bodyIdx);
    // Injecter le CSS d'impression juste avant </head>
    head = head.replace("</head>", PRINT_CSS + "</head>");

    // ── Pages ────────────────────────────────────────────────────────────────
    const pages: string[] = [];
    let pageNum = 1;

    // Cover
    pages.push(buildCover(getPage(html, 1), devis, now));
    pageNum++;

    // Pages event (on clone la page du type d'événement pour chaque chunk de sections)
    const evTemplate = getPage(html, cfg.ev);
    const chunks: Section[][] = [];
    for (let i = 0; i < Math.max(1, sections.length); i += 3)
      chunks.push(sections.slice(i, i + 3));

    for (let ci = 0; ci < chunks.length; ci++) {
      const isLastChunk = ci === chunks.length - 1;
      // Total TTC uniquement sur la dernière page event
      pages.push(buildEventPage(evTemplate, devis, chunks[ci], devis.totalTTC, pageNum++, ci * 3, isLastChunk));
    }

    // Prestations additionnelles (toujours présente)
    pages.push(buildPrestationsPage(getPage(html, 7), serviceItems, pageNum++));

    // Récapitulatif
    pages.push(buildRecapPage(getPage(html, cfg.recap), devis, sections, serviceItems, pageNum++));

    // Acompte / Échéancier
    pages.push(buildAcomptePage(getPage(html, cfg.acompte), devis, sections, pageNum++));

    // Page 20 : signature/mentions
    pages.push(buildSignaturePage(getPage(html, 20), devis, now, pageNum++));

    // ── Footer JS ─────────────────────────────────────────────────────────────
    const total = pages.length;
    const footerScript = `<script>
(function(){
  // Ajouter les footers sur chaque page
  document.querySelectorAll('.page').forEach(function(p,i){
    var f=document.createElement('div');
    f.style.cssText='position:absolute;bottom:5mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7px;color:#C99A43;padding-top:2px;font-family:Montserrat,Raleway,Arial,sans-serif;letter-spacing:0.04em;';
    f.innerHTML='<span>C.LC. Traiteur — contact@clctraiteur.fr — Rouen</span><span>Devis ${esc(devis.id)} &middot; '+(i+1)+'/${total}</span>';
    p.style.position='relative';
    p.appendChild(f);
  });
  // Attendre que toutes les images et polices soient chargées avant d'imprimer
  function doPrint(){
    var imgs = document.querySelectorAll('img');
    var pending = imgs.length;
    if(pending === 0){ window.print(); return; }
    function tryPrint(){ if(--pending <= 0) window.print(); }
    imgs.forEach(function(img){
      if(img.complete){ tryPrint(); }
      else { img.addEventListener('load', tryPrint); img.addEventListener('error', tryPrint); }
    });
  }
  if(document.readyState === 'complete'){ doPrint(); }
  else { window.addEventListener('load', doPrint); }
})();
</script>`;

    const final = `${head}<body>\n<main>\n${pages.join("\n")}\n</main>\n${footerScript}\n</body>\n</html>`;

    return new NextResponse(final, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${devis.id}.html"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pdf]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
