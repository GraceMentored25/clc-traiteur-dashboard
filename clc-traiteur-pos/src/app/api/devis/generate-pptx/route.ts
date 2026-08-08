import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import type { Devis, DevisItem } from "@/lib/types";

const TEMPLATE_PATH = path.join(process.cwd(), "public", "Devis_modele.pptx");

// ── Formatage ──────────────────────────────────────────────────────────────
const MOIS = ["","janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];

function fmtDate(iso: string): string {
  try {
    const [y, m, d] = iso.split("-");
    return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`;
  } catch { return iso; }
}

function fmtMoney(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} €`;
}

// ── Regroupement items par section ─────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }

function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string, DevisItem[]>();
  for (const item of items) {
    const key = item.section ?? "Prestation";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, its]) => ({
    label,
    items: its,
    subtotal: its.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  }));
}

// ── Remplacement texte dans XML slide ─────────────────────────────────────
// Un texte dans un .pptx peut être fragmenté sur plusieurs <a:r>.
// On fusionne tous les runs d'un paragraphe en un seul avant de remplacer.

function replaceText(xml: string, search: string, replace: string): string {
  // Simple global string replace (works when text is in one run)
  return xml.split(search).join(replace);
}

// Escape XML special chars
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ── Mapping événement → slide index (0-based in template) ─────────────────
const EVENT_SLIDE_MAP: Record<string, [number, number, number]> = {
  "mariage":           [1, 7, 8],
  "anniversaire":      [2, 9, 10],
  "baby shower":       [3, 11, 12],
  "séminaire":         [4, 13, 14],
  "seminaire":         [4, 13, 14],
  "réception privée":  [5, 15, 16],
  "reception privee":  [5, 15, 16],
};

function matchEvent(eventType: string): [number, number, number] {
  const et = eventType.toLowerCase().trim();
  for (const [key, val] of Object.entries(EVENT_SLIDE_MAP)) {
    if (et.includes(key) || key.includes(et)) return val;
  }
  return [1, 7, 8]; // défaut Mariage
}

// ── SECTION shapes du template (noms de shapes dans le XML) ───────────────
const SECTION_SLOTS = [
  {
    title: "Rectangle 16", desc: "Rectangle 17", sub: "Rectangle 20",
    plats: [
      ["Rectangle 22","Rectangle 23"],["Rectangle 25","Rectangle 26"],
      ["Rectangle 28","Rectangle 29"],["Rectangle 31","Rectangle 32"],
    ],
  },
  {
    title: "Rectangle 36", desc: "Rectangle 37", sub: "Rectangle 40",
    plats: [
      ["Rectangle 42","Rectangle 43"],["Rectangle 45","Rectangle 46"],
      ["Rectangle 48","Rectangle 49"],["Rectangle 51","Rectangle 52"],
    ],
  },
  {
    title: "Rectangle 56", desc: "Rectangle 57", sub: "Rectangle 60",
    plats: [
      ["Rectangle 62","Rectangle 63"],["Rectangle 65","Rectangle 66"],
      ["Rectangle 68","Rectangle 69"],
    ],
  },
];

// ── Helpers XML ────────────────────────────────────────────────────────────
function setShapeText(xml: string, shapeName: string, value: string): string {
  // Cherche <p:sp> contenant <p:nvSpPr><p:cNvPr name="shapeName"
  const safeVal = esc(value);
  // Regex pour trouver le contenu d'un shape par nom et remplacer le texte
  const re = new RegExp(
    `(<p:sp>(?:(?!</p:sp>)[\\s\\S])*?name="${shapeName.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}"[\\s\\S]*?<a:t>)([^<]*)(</a:t>)`,
    "g"
  );
  return xml.replace(re, (_m, before, _old, after) => `${before}${safeVal}${after}`);
}

function getAllShapeTexts(xml: string, shapeName: string): string[] {
  const results: string[] = [];
  const re = new RegExp(
    `<p:sp>(?:(?!</p:sp>)[\\s\\S])*?name="${shapeName.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}"[\\s\\S]*?<a:t>([^<]*)</a:t>`,
    "g"
  );
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

// Renumérote les ellipses de page (Ellipse avec le plus grand numéro sur chaque slide)
function renumberPage(xml: string, pageNum: number): string {
  // Cherche toutes les ellipses numériques et remplace la plus grande
  const ellipseRe = /<p:sp>(?:(?!<\/p:sp>)[\s\S])*?<p:cNvPr[^>]*name="Ellipse[^"]*"[\s\S]*?<a:t>(\d+)<\/a:t>[\s\S]*?<\/p:sp>/g;
  let maxVal = -1;
  let maxMatch = "";
  let m;
  while ((m = ellipseRe.exec(xml)) !== null) {
    const n = parseInt(m[1]);
    if (n > maxVal) { maxVal = n; maxMatch = m[1]; }
  }
  if (maxVal > 0) {
    // Remplacer seulement la dernière occurrence (la plus grande)
    const lastIdx = xml.lastIndexOf(`<a:t>${maxMatch}</a:t>`);
    if (lastIdx !== -1) {
      xml = xml.slice(0, lastIdx) + `<a:t>${pageNum}</a:t>` + xml.slice(lastIdx + `<a:t>${maxMatch}</a:t>`.length);
    }
  }
  return xml;
}

// ── Remplissage d'une slide événement ─────────────────────────────────────
function fillEventSlide(xml: string, devis: Devis, chunk: Section[], chunkOffset: number): string {
  xml = setShapeText(xml, "Rectangle 4",  devis.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 6",  `${devis.guestCount} convives`);
  xml = setShapeText(xml, "Rectangle 9",  fmtDate(devis.eventDate));
  xml = setShapeText(xml, "Rectangle 12", (devis as any).lieu ?? "France");

  let totalChunk = 0;
  for (let si = 0; si < SECTION_SLOTS.length; si++) {
    const slot = SECTION_SLOTS[si];
    if (si < chunk.length) {
      const sec = chunk[si];
      totalChunk += sec.subtotal;
      xml = setShapeText(xml, slot.title, `${chunkOffset + si + 1}. ${sec.label}`);
      xml = setShapeText(xml, slot.desc,  "");
      xml = setShapeText(xml, slot.sub,   fmtMoney(sec.subtotal));
      for (let pi = 0; pi < slot.plats.length; pi++) {
        const [pn, cn] = slot.plats[pi];
        if (pi < sec.items.length) {
          xml = setShapeText(xml, pn, sec.items[pi].dishName);
          xml = setShapeText(xml, cn, `${sec.items[pi].quantity} convives`);
        } else {
          xml = setShapeText(xml, pn, "");
          xml = setShapeText(xml, cn, "");
        }
      }
    } else {
      xml = setShapeText(xml, slot.title, "");
      xml = setShapeText(xml, slot.desc,  "");
      xml = setShapeText(xml, slot.sub,   "");
      for (const [pn, cn] of slot.plats) {
        xml = setShapeText(xml, pn, "");
        xml = setShapeText(xml, cn, "");
      }
    }
  }

  // Sous-total slide — Rectangle 72 ou 75
  for (const name of ["Rectangle 72", "Rectangle 75"]) {
    xml = setShapeText(xml, name, fmtMoney(totalChunk));
  }
  return xml;
}

// ── Remplissage récapitulatif ──────────────────────────────────────────────
function fillRecap(xml: string, devis: Devis, sections: Section[]): string {
  const totalEvent = sections.reduce((s, sec) => s + sec.subtotal, 0);
  xml = setShapeText(xml, "Rectangle 5",  devis.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 7",  `${devis.guestCount} convives`);
  xml = setShapeText(xml, "Rectangle 9",  fmtDate(devis.eventDate));
  xml = setShapeText(xml, "Rectangle 11", (devis as any).lieu ?? "France");

  const rows = [
    ["Rectangle 15","Rectangle 16","Rectangle 17","Rectangle 18"],
    ["Rectangle 21","Rectangle 22","Rectangle 23","Rectangle 24"],
    ["Rectangle 27","Rectangle 28","Rectangle 29","Rectangle 30"],
  ];
  for (let ri = 0; ri < rows.length; ri++) {
    const [rn, rl, rd, rp] = rows[ri];
    if (ri < sections.length) {
      const sec = sections[ri];
      xml = setShapeText(xml, rn, String(ri + 1));
      xml = setShapeText(xml, rl, sec.label);
      xml = setShapeText(xml, rd, "");
      xml = setShapeText(xml, rp, fmtMoney(sec.subtotal));
    } else {
      for (const n of [rn, rl, rd, rp]) xml = setShapeText(xml, n, "");
    }
  }
  xml = setShapeText(xml, "Rectangle 33", fmtMoney(totalEvent));
  xml = setShapeText(xml, "Rectangle 55", fmtMoney(devis.totalTTC));
  return xml;
}

// ── Remplissage acompte ────────────────────────────────────────────────────
function fillAcompte(xml: string, devis: Devis, sections: Section[]): string {
  const totalEvent = sections.reduce((s, sec) => s + sec.subtotal, 0);
  const ttc = devis.totalTTC;
  const a30 = Math.round(ttc * 0.30);
  const a40 = Math.round(ttc * 0.40);
  xml = setShapeText(xml, "Rectangle 5",  devis.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 8",  fmtMoney(ttc));
  xml = setShapeText(xml, "Rectangle 9",  `${fmtMoney(totalEvent)}  événement`);
  xml = setShapeText(xml, "Rectangle 14", fmtMoney(a30));
  xml = setShapeText(xml, "Rectangle 26", fmtMoney(a30));
  xml = setShapeText(xml, "Rectangle 32", fmtMoney(a40));
  xml = setShapeText(xml, "Rectangle 38", fmtMoney(a30));
  return xml;
}

// ── Remplissage cover ─────────────────────────────────────────────────────
function fillCover(xml: string, devis: Devis): string {
  xml = setShapeText(xml, "Rectangle 10", devis.clientName);
  xml = setShapeText(xml, "Rectangle 13", fmtDate(devis.eventDate));
  xml = setShapeText(xml, "Rectangle 16", devis.eventType);
  xml = setShapeText(xml, "Rectangle 19", (devis as any).lieu ?? "France");
  xml = setShapeText(xml, "Rectangle 22", devis.clientPhone ?? "");
  xml = setShapeText(xml, "Rectangle 25", devis.id);
  return xml;
}

// ── Détecter le type de slide ─────────────────────────────────────────────
function slideType(xml: string): string {
  const t = xml.toLowerCase();
  if (t.includes("rectangle 10") && t.includes("rectangle 25")) return "cover";
  if (t.includes("récapitulatif") || t.includes("recapitulatif") || t.includes("rectangle 33")) return "recap";
  if (t.includes("acompte") && t.includes("échéancier")) return "acompte";
  if (t.includes("mentions") || t.includes("légales")) return "mentions";
  if (t.includes("accord") || t.includes("signature")) return "signature";
  if (t.includes("prestation")) return "prestations";
  if (t.includes("légende") || t.includes("legende") || t.includes("pictogramme")) return "legende";
  return "event";
}

// ── Route API ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };
    const ref   = devis.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sections = groupSections(devis.items);
    const [evIdx, rcIdx, acIdx] = matchEvent(devis.eventType);

    // Lire le template
    const templateBuf = fs.readFileSync(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(templateBuf);

    // Lister toutes les slides
    const slideEntries = Object.keys(zip.files)
      .filter(n => n.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)![0]);
        const nb = parseInt(b.match(/\d+/)![0]);
        return na - nb;
      });

    // Slides à garder (indices 0-based)
    const KEEP = new Set([0, evIdx, rcIdx, acIdx, 6, 17, 18]);
    // Slides à supprimer (tous sauf KEEP)
    const toDelete = slideEntries.filter((_, i) => !KEEP.has(i));

    // Supprimer les slides non nécessaires du zip
    for (const entry of toDelete) {
      zip.remove(entry);
      // Supprimer aussi les rels associées
      const relName = entry.replace("ppt/slides/slide", "ppt/slides/_rels/slide").replace(".xml", ".xml.rels");
      zip.remove(relName);
    }

    // Mettre à jour ppt/presentation.xml pour enlever les sldId des slides supprimées
    const presXmlStr = await zip.file("ppt/presentation.xml")?.async("string") ?? "";
    // Garder uniquement les rId des slides conservées
    const keptSlideNames = slideEntries.filter((_, i) => KEEP.has(i));

    // Récupérer la map rId → filename depuis ppt/_rels/presentation.xml.rels
    const presRelsStr = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string") ?? "";
    const ridToFile = new Map<string, string>();
    const relRe = /Id="(rId\d+)"[^/]*Target="slides\/(slide\d+\.xml)"/g;
    let relMatch: RegExpExecArray | null;
    while ((relMatch = relRe.exec(presRelsStr)) !== null) {
      ridToFile.set(relMatch[1], `ppt/slides/${relMatch[2]}`);
    }
    const keptRIds = new Set(
      Array.from(ridToFile.entries())
        .filter(([, f]) => keptSlideNames.includes(f))
        .map(([rid]) => rid)
    );

    // Filtrer sldIdLst dans presentation.xml
    let newPresXml = presXmlStr.replace(
      /<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/,
      (_full, inner) => {
        const filtered = inner.replace(
          /<p:sldId[^/]*\/>/g,
          (tag: string) => {
            const ridMatch = tag.match(/r:id="([^"]+)"/);
            if (!ridMatch) return tag;
            return keptRIds.has(ridMatch[1]) ? tag : "";
          }
        );
        return `<p:sldIdLst>${filtered}</p:sldIdLst>`;
      }
    );
    zip.file("ppt/presentation.xml", newPresXml);

    // ── Remplir les slides conservées ────────────────────────────────────
    // Calculer le nombre de chunks nécessaires (3 sections par slide event)
    const nChunks = Math.max(1, Math.ceil(sections.length / 3));

    // Slide événement de base
    const eventSlideName = slideEntries[evIdx];
    let eventXmlBase = await zip.file(eventSlideName)?.async("string") ?? "";

    // Remplir et éventuellement dupliquer pour les chunks supplémentaires
    for (let ci = 0; ci < nChunks; ci++) {
      const chunk = sections.slice(ci * 3, ci * 3 + 3);
      let xml = ci === 0 ? eventXmlBase : eventXmlBase; // toujours partir de la base
      xml = fillEventSlide(xml, devis, chunk, ci * 3);

      if (ci === 0) {
        zip.file(eventSlideName, xml);
      } else {
        // Dupliquer la slide event avec un nouveau nom
        const newName = eventSlideName.replace(/slide(\d+)\.xml/, `slide_extra${ci}.xml`);
        zip.file(newName, xml);
        // Ajouter les rels de la slide copiée
        const baseRelName = eventSlideName
          .replace("ppt/slides/slide", "ppt/slides/_rels/slide")
          .replace(".xml", ".xml.rels");
        const baseRels = await zip.file(baseRelName)?.async("string") ?? "";
        if (baseRels) {
          zip.file(newName.replace("ppt/slides/", "ppt/slides/_rels/").replace(".xml", ".xml.rels"), baseRels);
        }
      }
    }

    // Cover
    const coverName = slideEntries[0];
    let coverXml = await zip.file(coverName)?.async("string") ?? "";
    coverXml = fillCover(coverXml, devis);
    zip.file(coverName, coverXml);

    // Récapitulatif
    const rcName = slideEntries[rcIdx];
    let rcXml = await zip.file(rcName)?.async("string") ?? "";
    rcXml = fillRecap(rcXml, devis, sections);
    zip.file(rcName, rcXml);

    // Acompte
    const acName = slideEntries[acIdx];
    let acXml = await zip.file(acName)?.async("string") ?? "";
    acXml = fillAcompte(acXml, devis, sections);
    zip.file(acName, acXml);

    // ── Renumérotation des pages ─────────────────────────────────────────
    // Reconstruire la liste des slides conservées dans le zip
    const finalSlides = Object.keys(zip.files)
      .filter(n => n.match(/^ppt\/slides\/slide[^/]+\.xml$/) && !n.includes("_rels"))
      .sort((a, b) => {
        // Ordre : slides numérotées d'abord, extras ensuite
        const na = a.match(/slide(\d+)\.xml/)?.[1];
        const nb = b.match(/slide(\d+)\.xml/)?.[1];
        if (na && nb) return parseInt(na) - parseInt(nb);
        return a.localeCompare(b);
      });

    for (let pi = 0; pi < finalSlides.length; pi++) {
      const fname = finalSlides[pi];
      let sxml = await zip.file(fname)?.async("string") ?? "";
      sxml = renumberPage(sxml, pi + 1);
      zip.file(fname, sxml);
    }

    // ── Générer le buffer final ───────────────────────────────────────────
    const outBuf = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(outBuf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${ref}.pptx"`,
        "Content-Length": String(outBuf.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pptx]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
