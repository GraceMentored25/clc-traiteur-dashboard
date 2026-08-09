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
function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Icône SVG générique (plat) identique au template ────────────────────────
const FOOD_ICON_SVG = `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path fill="currentColor" d="M3 10v2h2v7c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2v-7h2v-2zm4 2h10v7H7z"/></svg>`;

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
  const services = ["serveur","marmite","service de table","tente","chapiteau","chaise","déco","décoration","transport","livraison","sono","animation","photographe"];
  const n = dishName.toLowerCase();
  return services.some(s => n.includes(s));
}

// ── Extraction d'une section <section data-page="N"> du template ─────────────
function extractPageSection(html: string, pageNum: number): string {
  const startTag = `<section class="page-host" data-page="${pageNum}"`;
  const nextTag  = `<section class="page-host" data-page="${pageNum + 1}"`;
  const start = html.indexOf(startTag);
  if (start < 0) return "";
  const end = html.indexOf(nextTag);
  return end > start ? html.slice(start, end) : html.slice(start);
}

// ── Remplacement d'une valeur editable par sa classe ────────────────────────
// Remplace le contenu (entre les balises) d'un élément portant la classe CSS donnée
function replaceClass(html: string, cls: string, newValue: string, nth = 0): string {
  // Matches <div class="...CLS..."...>ANYTHING</div>  (non-greedy, single element)
  const re = new RegExp(`(<(?:div|span)[^>]*class="[^"]*\\b${cls.replace(/[-]/g,"\\-")}\\b[^"]*"[^>]*>)([^<]*)(<\\/(?:div|span)>)`, "g");
  let count = 0;
  return html.replace(re, (_full, open, _old, close) => {
    if (count++ === nth) return `${open}${newValue}${close}`;
    return _full;
  });
}

// ── Remplacement de TOUS les contenteditable d'une classe ───────────────────
function replaceAllOfClass(html: string, cls: string, newValue: string): string {
  const re = new RegExp(`(<(?:div|span)[^>]*class="[^"]*\\b${cls.replace(/[-]/g,"\\-")}\\b[^"]*"[^>]*>)([^<]*)(<\\/(?:div|span)>)`, "g");
  return html.replace(re, (_full, open, _old, close) => `${open}${newValue}${close}`);
}

// ── Construction d'un food-row identique au template ────────────────────────
function buildFoodRow(name: string, qty: number): string {
  return `<div class="food-row"><span class="icon menu-ico">${FOOD_ICON_SVG}</span><div class="editable food-name" contenteditable="true" spellcheck="false">${escHtml(name)}</div><div class="editable food-qty" contenteditable="true" spellcheck="false">${qty} convives</div></div>`;
}

// ── Construction d'une menu-card complète ────────────────────────────────────
// Hauteur : card-head=78px + food-list.top=88px + items*33px + 10px padding
function buildMenuCard(
  index: number,
  section: Section,
  topPx: number,
  templateCardHtml: string, // une vraie card du template (pour garder la photo)
): string {
  const itemCount = section.items.length;
  const heightPx  = 78 + 10 + itemCount * 33 + 14; // card-head + gap + rows + padding
  const rows = section.items.map(i => buildFoodRow(i.dishName, i.quantity)).join("");

  // Prendre l'image de la vraie card-head du template (on remplace titre/sous-titre/prix)
  // Extraire le bloc card-head du template pour réutiliser la photo
  const chStart = templateCardHtml.indexOf('<div class="card-head">');
  const chEnd   = templateCardHtml.indexOf('<div class="food-list">');
  let cardHead  = chStart >= 0 && chEnd > chStart
    ? templateCardHtml.slice(chStart, chEnd)
    : `<div class="card-head"><div class="card-head-gradient"></div><div class="editable card-title" contenteditable="true" spellcheck="false">${index}. ${escHtml(section.label)}</div><div class="editable card-sub" contenteditable="true" spellcheck="false"></div><div class="price-box"><div class="editable price-label" contenteditable="true" spellcheck="false">Sous-total</div><div class="editable price-value" contenteditable="true" spellcheck="false">${fmtMoney(section.subtotal)}</div></div></div>`;

  // Remplacer le titre, sous-titre et prix dans le card-head
  cardHead = replaceClass(cardHead, "card-title",  `${index}. ${escHtml(section.label)}`);
  cardHead = replaceClass(cardHead, "card-sub",    "");
  cardHead = replaceClass(cardHead, "price-value", fmtMoney(section.subtotal));

  return `<div class="menu-card" style="top:${topPx}px;height:${heightPx}px">${cardHead}<div class="food-list">${rows}</div></div>`;
}

// ── Reconstruction de la page de détail événement ────────────────────────────
function rebuildEventPage(
  templatePageHtml: string,
  pageNum: number,
  devis: Devis & { lieu?: string },
  sections: Section[],
  totalTTC: number,
): string {
  let html = templatePageHtml;

  // 1. Mettre à jour le numéro de page
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${pageNum}$2`);
  html = html.replace(/data-page="\d+"/, `data-page="${pageNum}"`);

  // 2. Meta-bar (convives, date, lieu)
  const metaTexts = [`${devis.guestCount} convives`, fmtDate(devis.eventDate), devis.lieu ?? "Rouen, France"];
  let metaCount = 0;
  html = html.replace(/(<div[^>]*class="[^"]*\bmeta-text\b[^"]*"[^>]*>)[^<]*(<\/div>)/g, (_full, open, close) => {
    const val = metaTexts[metaCount++] ?? "";
    return `${open}${val}${close}`;
  });

  // 3. Supprimer toutes les menu-cards existantes et l'event-total existant
  // On supprime tout entre la meta-bar et la fin de l'article
  const metaEndIdx = html.indexOf('</div></div>', html.indexOf('class="meta"'));
  const articleEndIdx = html.lastIndexOf('</article>');
  if (metaEndIdx > 0 && articleEndIdx > metaEndIdx) {
    const beforeCards = html.slice(0, metaEndIdx + 12); // garde la meta-bar
    const afterArticle = html.slice(articleEndIdx);

    // Extraire les card-heads du template (pour les photos) avant de les supprimer
    const templateCards: string[] = [];
    let cardSearchPos = metaEndIdx;
    while (true) {
      const cardStart = html.indexOf('<div class="menu-card"', cardSearchPos);
      if (cardStart < 0 || cardStart >= articleEndIdx) break;
      const cardEnd = html.indexOf('<div class="menu-card"', cardStart + 50);
      const end = (cardEnd > 0 && cardEnd < articleEndIdx) ? cardEnd : articleEndIdx;
      templateCards.push(html.slice(cardStart, end));
      cardSearchPos = cardStart + 50;
    }

    // Reconstruire les cartes
    let currentTop = 235; // position de la première card dans le template
    const CARD_GAP = 14;
    const cardsHtml = sections.map((sec, i) => {
      const templateCard = templateCards[i] ?? templateCards[0] ?? "";
      const card = buildMenuCard(i + 1, sec, currentTop, templateCard);
      const heightPx = 78 + 10 + sec.items.length * 33 + 14;
      currentTop += heightPx + CARD_GAP;
      return card;
    }).join("");

    // Reconstruire le event-total
    const totalTop = currentTop + 8;
    const eventTotal = `<div class="event-total" style="top:${totalTop}px"><div class="editable event-total-label" contenteditable="true" spellcheck="false">TOTAL TTC</div><div class="editable event-total-value" contenteditable="true" spellcheck="false">${fmtMoney(totalTTC)}</div></div>`;

    html = beforeCards + cardsHtml + eventTotal + afterArticle;
  }

  return html;
}

// ── Reconstruction page récapitulatif ─────────────────────────────────────────
function rebuildRecapPage(
  templatePageHtml: string,
  pageNum: number,
  devis: Devis & { lieu?: string },
  sections: Section[],
  serviceItems: DevisItem[],
): string {
  let html = templatePageHtml;

  // Numéro de page
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${pageNum}$2`);
  html = html.replace(/data-page="\d+"/, `data-page="${pageNum}"`);

  // Event type dans le bandeau
  html = replaceClass(html, "recap-event", escHtml(devis.eventType.toUpperCase()));

  // Meta (convives + date)
  html = replaceClass(html, "recap-meta-text", `${devis.guestCount} convives`);
  html = replaceClass(html, "recap-meta-date", fmtDate(devis.eventDate));

  // Sections traiteur (lignes fixes du template)
  const rowSelectors = [
    ["recap-num-1","recap-label-1","recap-desc-1","recap-price-1"],
    ["recap-num-2","recap-label-2","recap-desc-2","recap-price-2"],
    ["recap-num-3","recap-label-3","recap-desc-3","recap-price-3"],
  ];
  // Le template a des classes génériques — on utilise position
  // Chercher les recap-section divs et les remplacer
  const totalTraiteur = sections.reduce((s,x) => s + x.subtotal, 0);

  // Sous-total traiteur
  html = replaceClass(html, "recap-subtotal", fmtMoney(totalTraiteur * 1.2));

  // Prestations additionnelles
  const totalServices = serviceItems.reduce((s,i) => s + i.quantity * i.unitPrice, 0);
  const hasServices = serviceItems.length > 0;

  if (!hasServices) {
    // Aucune prestation : remplacer le premier extra-name par le message
    html = replaceClass(html, "extra-name", "Aucune prestation n'a été sélectionnée.");
    html = replaceClass(html, "extra-detail", "");
    html = replaceClass(html, "extra-price", "");
  }

  // Sous-total prestations additionnelles
  html = replaceClass(html, "extras-subtotal", hasServices ? fmtMoney(totalServices * 1.2) : "0 €");

  // Total TTC global
  html = replaceClass(html, "grand-value", fmtMoney(devis.totalTTC));
  html = replaceClass(html, "grand-sub", hasServices ? "Événement + prestations additionnelles" : "Prestation traiteur uniquement");

  void rowSelectors; // unused but kept for reference
  return html;
}

// ── Reconstruction page acompte ───────────────────────────────────────────────
function rebuildAcomptePage(
  templatePageHtml: string,
  pageNum: number,
  devis: Devis,
): string {
  let html = templatePageHtml;
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${pageNum}$2`);
  html = html.replace(/data-page="\d+"/, `data-page="${pageNum}"`);

  const ttc = devis.totalTTC;
  const a30 = Math.round(ttc * 0.30);
  const a40 = Math.round(ttc * 0.40);

  html = replaceClass(html, "grand-value", fmtMoney(ttc));
  // Montants acompte dans les schedule-amount (positions 0,1,2)
  const amounts = [fmtMoney(a30), fmtMoney(a40), fmtMoney(a30)];
  let ai = 0;
  html = html.replace(/(<div[^>]*class="[^"]*\bschedule-amount\b[^"]*"[^>]*>)[^<]*(<\/div>)/g,
    (_full, open, close) => `${open}${amounts[ai++] ?? ""}${close}`);

  html = replaceClass(html, "payment-total-value", fmtMoney(ttc));

  return html;
}

// ── Reconstruction cover ──────────────────────────────────────────────────────
function rebuildCover(templatePageHtml: string, devis: Devis & { lieu?: string }, now: string): string {
  let html = templatePageHtml;
  // Remplacer les cover-value dans l'ordre : Client, Date, Événement, Lieu, Contact, N° Devis
  const coverValues = [
    devis.clientName,
    fmtDate(devis.eventDate),
    devis.eventType,
    devis.lieu ?? "Rouen, France",
    devis.clientPhone ?? "",
    devis.id,
  ];
  let cvIdx = 0;
  html = html.replace(/(<div[^>]*class="[^"]*\bcover-value\b[^"]*"[^>]*>)[^<]*(<\/div>)/g,
    (_full, open, close) => `${open}${escHtml(coverValues[cvIdx++] ?? "")}${close}`);
  // Numéro de page
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, "$11$2");
  void now;
  return html;
}

// ── Reconstruction dernière page (signature) ──────────────────────────────────
function rebuildSignaturePage(templatePageHtml: string, devis: Devis, pageNum: number, now: string): string {
  let html = templatePageHtml;
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${pageNum}$2`);
  html = html.replace(/data-page="\d+"/, `data-page="${pageNum}"`);

  // Remplir client name et date "Fait à"
  html = replaceClass(html, "sig-client", escHtml(devis.clientName));
  html = replaceClass(html, "fait-a-date", `Fait à Rouen, le ${now}`);

  // Remplacer aussi le contenu de la div "editable " (classe vide = lieu)
  // La dernière page a "Rouen, France" dans un div.editable vide
  html = html.replace(
    /(<div[^>]*class="editable\s*"[^>]*contenteditable="true"[^>]*>)([^<]*)(<\/div>)/,
    `$1Rouen, France$3`,
  );

  return html;
}

// ── Mapping événement → pages event du template (1-indexed) ──────────────────
// Pages 2-7 : chaque page correspond à un type d'événement
// Page 8+ : récap/acompte par paires selon l'événement
const EVENT_CONFIG: Record<string, { eventPages: number[]; recapPage: number; acomptePage: number }> = {
  "mariage":           { eventPages: [2, 3], recapPage: 9,  acomptePage: 10 },
  "anniversaire":      { eventPages: [3, 4], recapPage: 11, acomptePage: 12 },
  "bapteme":           { eventPages: [4, 5], recapPage: 13, acomptePage: 14 },
  "baby shower":       { eventPages: [4, 5], recapPage: 13, acomptePage: 14 },
  "baptême":           { eventPages: [4, 5], recapPage: 13, acomptePage: 14 },
  "séminaire":         { eventPages: [5, 6], recapPage: 15, acomptePage: 16 },
  "seminaire":         { eventPages: [5, 6], recapPage: 15, acomptePage: 16 },
  "entreprise":        { eventPages: [5, 6], recapPage: 15, acomptePage: 16 },
  "réception":         { eventPages: [6, 7], recapPage: 17, acomptePage: 18 },
  "reception":         { eventPages: [6, 7], recapPage: 17, acomptePage: 18 },
};

function matchEventConfig(eventType: string) {
  const e = eventType.toLowerCase().trim();
  for (const [k, v] of Object.entries(EVENT_CONFIG)) {
    if (e.includes(k) || k.includes(e)) return v;
  }
  return { eventPages: [2, 3], recapPage: 9, acomptePage: 10 };
}

// ── Reconstruction page prestations additionnelles (page 8) ──────────────────
function rebuildPrestationsPage(
  templatePageHtml: string,
  pageNum: number,
  serviceItems: DevisItem[],
): string {
  let html = templatePageHtml;
  html = html.replace(/(<span[^>]*class="[^"]*\bpn\b[^"]*"[^>]*>)\d*(<\/span>)/, `$1${pageNum}$2`);
  html = html.replace(/data-page="\d+"/, `data-page="${pageNum}"`);

  const hasServices = serviceItems.length > 0;

  // Service slots dans le template
  const serviceSlots = [
    { keywords: ["serveur","personnel"], label: "Service & personnel", desc: "Serveurs, maîtres d'hôtel" },
    { keywords: ["matériel","couvert","table","chaise","marmite"], label: "Location de matériel", desc: "Couverts, tables, chaises" },
    { keywords: ["livraison","transport"], label: "Livraison", desc: "Transport & livraison des plats" },
    { keywords: ["décoration","déco","floral"], label: "Décoration de table", desc: "Fleurs, bougies, centres de table" },
    { keywords: ["tente","chapiteau"], label: "Location de tente", desc: "Tentes & chapiteaux" },
    { keywords: ["animation","sono","musique","dj"], label: "Animation musicale", desc: "DJ, sonorisation, animation" },
    { keywords: ["gâteau","photographe","photo"], label: "Gâteau & photo", desc: "Pièce montée, reportage photo" },
  ];

  // Sous-total prestations
  const subtotal = serviceItems.reduce((s,i) => s + i.quantity * i.unitPrice, 0);
  html = replaceClass(html, "additional-total-value", hasServices ? fmtMoney(subtotal) : "0 €");

  // Note selon sélection
  html = replaceClass(html, "note-text",
    hasServices
      ? "Les prestations cochées sont incluses au présent devis et seront réalisées. Toute modification devra être validée avant exécution."
      : "Aucune prestation additionnelle n'a été sélectionnée pour cet événement."
  );

  void serviceSlots;
  return html;
}

// ── API Route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };

    const serviceItems = devis.items.filter(i => isService(i.dishName));
    const dishItems    = devis.items.filter(i => !isService(i.dishName));
    const sections     = groupSections(dishItems);
    const cfg          = matchEventConfig(devis.eventType);

    const now = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

    const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");

    // ── Extraire head + styles ───────────────────────────────────────────────
    const bodyIdx   = templateHtml.indexOf("<body");
    const headBlock = templateHtml.slice(0, bodyIdx);

    // ── Assembler les pages ──────────────────────────────────────────────────
    const pageBlocks: string[] = [];

    // Page 1 : Cover
    const cover = extractPageSection(templateHtml, 1);
    pageBlocks.push(rebuildCover(cover, devis, now));

    // Pages event : on prend la première page event du type d'événement
    // On en génère autant que nécessaire (chunks de 3 sections max)
    const eventTemplatePage = extractPageSection(templateHtml, cfg.eventPages[0]);
    const sectionChunks: Section[][] = [];
    for (let i = 0; i < Math.max(1, sections.length); i += 3) {
      sectionChunks.push(sections.slice(i, i + 3));
    }
    sectionChunks.forEach((chunk, ci) => {
      const totalChunk = ci === 0 ? devis.totalTTC
        : chunk.reduce((s, sec) => s + sec.subtotal * 1.2, 0);
      pageBlocks.push(rebuildEventPage(eventTemplatePage, pageBlocks.length + 1, devis, chunk, totalChunk));
    });

    // Page prestations additionnelles (toujours présente)
    const prestationsTemplatePage = extractPageSection(templateHtml, 8);
    pageBlocks.push(rebuildPrestationsPage(prestationsTemplatePage, pageBlocks.length + 1, serviceItems));

    // Page récap
    const recapTemplatePage = extractPageSection(templateHtml, cfg.recapPage);
    pageBlocks.push(rebuildRecapPage(recapTemplatePage, pageBlocks.length + 1, devis, sections, serviceItems));

    // Page acompte
    const acompteTemplatePage = extractPageSection(templateHtml, cfg.acomptePage);
    pageBlocks.push(rebuildAcomptePage(acompteTemplatePage, pageBlocks.length + 1, devis));

    // Page 20 : Signature/mentions légales
    const sigTemplatePage = extractPageSection(templateHtml, 20);
    pageBlocks.push(rebuildSignaturePage(sigTemplatePage, devis, pageBlocks.length + 1, now));

    // ── Override CSS pour l'impression ──────────────────────────────────────
    const printOverrides = `
<style>
  .toolbar { display:none !important; }
  @media screen {
    body { padding: 20px; background: #111; }
    .page-host { display:block !important; margin: 0 auto 20px; box-shadow: 0 8px 40px rgba(0,0,0,.5); }
  }
  @media print {
    @page { size: A4; margin: 0; }
    body { padding: 0; background: white; }
    .page-host { display: block !important; width: 210mm; height: 297mm; margin: 0;
                 page-break-after: always; box-shadow: none; }
    .page-host:last-child { page-break-after: avoid; }
    .page { transform: none !important; width: 210mm; height: 297mm; }
    .page-number { display: none !important; }
  }
</style>`;

    // ── HTML final ───────────────────────────────────────────────────────────
    const totalPages = pageBlocks.length;
    const finalHtml = `${headBlock}${printOverrides}</head>
<body>
<main>
${pageBlocks.join("\n")}
</main>
<script>
(function() {
  // Inject page footers
  var pages = document.querySelectorAll('.page');
  pages.forEach(function(p, i) {
    var footer = document.createElement('div');
    footer.style.cssText = 'position:absolute;bottom:6mm;left:14mm;right:14mm;display:flex;justify-content:space-between;font-size:7.5px;color:#6C6A62;border-top:1px solid #D9CEBF;padding-top:3px;font-family:Raleway,Arial,sans-serif;';
    footer.innerHTML = '<span>C.LC. Traiteur — contact@clctraiteur.fr — Rouen</span><span>Devis ${escHtml(devis.id)} &middot; Page ' + (i+1) + '/${totalPages}</span>';
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
        "Content-Disposition": `inline; filename="${devis.id}.html"`,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pdf]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
