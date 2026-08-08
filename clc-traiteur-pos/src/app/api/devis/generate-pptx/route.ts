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
  try { const [y,m,d] = iso.split("-"); return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`; }
  catch { return iso; }
}
function fmtMoney(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}
function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

// ── Remplacement texte robuste ─────────────────────────────────────────────
// Split sur <p:sp>, find the shape by name, replace first <a:t>
function setShapeText(xml: string, shapeName: string, value: string): string {
  const parts = xml.split("<p:sp>");
  for (let i = 1; i < parts.length; i++) {
    const nameTag = `name="${shapeName}"`;
    const endIdx  = parts[i].indexOf("</p:sp>");
    if (endIdx < 0) continue;
    if (!parts[i].slice(0, endIdx).includes(nameTag)) continue;
    let replaced = false;
    parts[i] = parts[i].replace(/<a:t>[^<]*<\/a:t>/, () => {
      if (replaced) return `<a:t></a:t>`;
      replaced = true;
      return `<a:t>${esc(value)}</a:t>`;
    });
    break;
  }
  return parts.join("<p:sp>");
}

// ── Groupement sections ────────────────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }

function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string, DevisItem[]>();
  for (const item of items) {
    const key = item.section ?? "Prestation";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label, its]) => ({
    label, items: its,
    subtotal: its.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  }));
}

// ── Mapping événement → index slide (0-based) ──────────────────────────────
// Template : slide1=Cover, slide2=Mariage, slide3=Anniv, slide4=Baby,
//            slide5=Séminaire, slide6=Réception, slide7=Prestations,
//            slide8=Récap Mariage, slide9=Acompte Mariage,
//            slide10=Récap Anniv, slide11=Acompte Anniv, ...
//            slide18=Mentions, slide19=Signature, slide20=Légende
const EVENT_MAP: Record<string, [number,number,number]> = {
  "mariage":          [1, 7, 8],
  "anniversaire":     [2, 9, 10],
  "baby shower":      [3, 11, 12],
  "séminaire":        [4, 13, 14],
  "seminaire":        [4, 13, 14],
  "réception privée": [5, 15, 16],
  "reception privee": [5, 15, 16],
};
function matchEvent(et: string): [number,number,number] {
  const e = et.toLowerCase().trim();
  for (const [k,v] of Object.entries(EVENT_MAP))
    if (e.includes(k) || k.includes(e)) return v;
  return [1, 7, 8];
}

// ── Slots sections dans le template événement ──────────────────────────────
const SLOTS = [
  { title:"Rectangle 16", desc:"Rectangle 17", sub:"Rectangle 20",
    plats:[["Rectangle 22","Rectangle 23"],["Rectangle 25","Rectangle 26"],
           ["Rectangle 28","Rectangle 29"],["Rectangle 31","Rectangle 32"]] },
  { title:"Rectangle 36", desc:"Rectangle 37", sub:"Rectangle 40",
    plats:[["Rectangle 42","Rectangle 43"],["Rectangle 45","Rectangle 46"],
           ["Rectangle 48","Rectangle 49"],["Rectangle 51","Rectangle 52"]] },
  { title:"Rectangle 56", desc:"Rectangle 57", sub:"Rectangle 60",
    plats:[["Rectangle 62","Rectangle 63"],["Rectangle 65","Rectangle 66"],
           ["Rectangle 68","Rectangle 69"]] },
];

// ── Remplissage slides ─────────────────────────────────────────────────────
function fillCover(xml: string, d: Devis & {lieu?:string}): string {
  xml = setShapeText(xml, "Rectangle 10", d.clientName);
  xml = setShapeText(xml, "Rectangle 13", fmtDate(d.eventDate));
  xml = setShapeText(xml, "Rectangle 16", d.eventType);
  xml = setShapeText(xml, "Rectangle 19", d.lieu ?? "France");
  xml = setShapeText(xml, "Rectangle 22", d.clientPhone ?? "");
  xml = setShapeText(xml, "Rectangle 25", d.id);
  return xml;
}

function fillEvent(xml: string, d: Devis & {lieu?:string}, chunk: Section[], offset: number): string {
  xml = setShapeText(xml, "Rectangle 4",  d.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 6",  `${d.guestCount} convives`);
  xml = setShapeText(xml, "Rectangle 9",  fmtDate(d.eventDate));
  xml = setShapeText(xml, "Rectangle 12", d.lieu ?? "France");
  let total = 0;
  for (let si = 0; si < SLOTS.length; si++) {
    const slot = SLOTS[si];
    if (si < chunk.length) {
      const sec = chunk[si]; total += sec.subtotal;
      xml = setShapeText(xml, slot.title, `${offset+si+1}. ${sec.label}`);
      xml = setShapeText(xml, slot.desc,  "");
      xml = setShapeText(xml, slot.sub,   fmtMoney(sec.subtotal));
      for (let pi = 0; pi < slot.plats.length; pi++) {
        const [pn,cn] = slot.plats[pi];
        if (pi < sec.items.length) {
          xml = setShapeText(xml, pn, sec.items[pi].dishName);
          xml = setShapeText(xml, cn, `${sec.items[pi].quantity} convives`);
        } else {
          xml = setShapeText(xml, pn, ""); xml = setShapeText(xml, cn, "");
        }
      }
    } else {
      xml = setShapeText(xml, slot.title, ""); xml = setShapeText(xml, slot.desc, "");
      xml = setShapeText(xml, slot.sub, "");
      for (const [pn,cn] of slot.plats) { xml = setShapeText(xml, pn, ""); xml = setShapeText(xml, cn, ""); }
    }
  }
  // Sous-total slide
  xml = setShapeText(xml, "Rectangle 72", fmtMoney(total));
  xml = setShapeText(xml, "Rectangle 75", fmtMoney(total));
  return xml;
}

function fillRecap(xml: string, d: Devis & {lieu?:string}, secs: Section[]): string {
  const totalEv = secs.reduce((s,x)=>s+x.subtotal,0);
  xml = setShapeText(xml, "Rectangle 5",  d.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 7",  `${d.guestCount} convives`);
  xml = setShapeText(xml, "Rectangle 9",  fmtDate(d.eventDate));
  xml = setShapeText(xml, "Rectangle 11", d.lieu ?? "France");
  const rows = [
    ["Rectangle 15","Rectangle 16","Rectangle 17","Rectangle 18"],
    ["Rectangle 21","Rectangle 22","Rectangle 23","Rectangle 24"],
    ["Rectangle 27","Rectangle 28","Rectangle 29","Rectangle 30"],
  ];
  for (let ri=0; ri<rows.length; ri++) {
    const [rn,rl,rd,rp] = rows[ri];
    if (ri<secs.length) {
      const s=secs[ri];
      xml=setShapeText(xml,rn,String(ri+1)); xml=setShapeText(xml,rl,s.label);
      xml=setShapeText(xml,rd,""); xml=setShapeText(xml,rp,fmtMoney(s.subtotal));
    } else {
      for (const n of [rn,rl,rd,rp]) xml=setShapeText(xml,n,"");
    }
  }
  xml = setShapeText(xml, "Rectangle 33", fmtMoney(totalEv));
  xml = setShapeText(xml, "Rectangle 55", fmtMoney(d.totalTTC));
  return xml;
}

function fillAcompte(xml: string, d: Devis, secs: Section[]): string {
  const totalEv = secs.reduce((s,x)=>s+x.subtotal,0);
  const ttc = d.totalTTC;
  const a30 = Math.round(ttc*0.30), a40 = Math.round(ttc*0.40);
  xml = setShapeText(xml, "Rectangle 5",  d.eventType.toUpperCase());
  xml = setShapeText(xml, "Rectangle 8",  fmtMoney(ttc));
  xml = setShapeText(xml, "Rectangle 9",  `${fmtMoney(totalEv)}  événement`);
  xml = setShapeText(xml, "Rectangle 14", fmtMoney(a30));
  xml = setShapeText(xml, "Rectangle 26", fmtMoney(a30));
  xml = setShapeText(xml, "Rectangle 32", fmtMoney(a40));
  xml = setShapeText(xml, "Rectangle 38", fmtMoney(a30));
  return xml;
}

// ── Renumérotation pages ───────────────────────────────────────────────────
function renumberPage(xml: string, pageNum: number): string {
  // Trouve l'ellipse avec le plus grand numéro (= numéro de page global)
  const re = /(<p:sp>(?:(?!<p:sp>)[\s\S])*?name="Ellipse[^"]*"[\s\S]*?<a:t>)(\d+)(<\/a:t>[\s\S]*?<\/p:sp>)/g;
  let maxN = -1; let maxFull = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const n = parseInt(m[2]);
    if (n > maxN) { maxN = n; maxFull = m[0]; }
  }
  if (maxFull && maxN > 0) {
    // Remplacer seulement la dernière Ellipse avec ce numéro
    const lastIdx = xml.lastIndexOf(`>${maxN}</a:t>`);
    if (lastIdx > 0) {
      xml = xml.slice(0, lastIdx+1) + String(pageNum) + xml.slice(lastIdx+1+String(maxN).length);
    }
  }
  return xml;
}

// ── Dupliquer une slide dans le zip ────────────────────────────────────────
async function duplicateSlide(zip: JSZip, sourceName: string, newName: string) {
  const srcXml = await zip.file(sourceName)?.async("string") ?? "";
  zip.file(newName, srcXml);
  // Copier les rels
  const srcRel = sourceName.replace("ppt/slides/", "ppt/slides/_rels/").replace(".xml", ".xml.rels");
  const relXml = await zip.file(srcRel)?.async("string");
  if (relXml) {
    const dstRel = newName.replace("ppt/slides/", "ppt/slides/_rels/").replace(".xml", ".xml.rels");
    zip.file(dstRel, relXml);
  }
}

// ── API Route ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };
    const ref   = devis.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    const secs  = groupSections(devis.items);
    const [evIdx, rcIdx, acIdx] = matchEvent(devis.eventType);

    const templateBuf = fs.readFileSync(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(templateBuf);

    // Liste ordonnée des slides
    const allSlides = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));

    // Slides à conserver (0-based)
    const KEEP = new Set([0, evIdx, rcIdx, acIdx, 6, 17, 18]);
    // slide20 = légende (index 19) → toujours supprimer

    // ── Suppression des slides inutiles ──────────────────────────────────
    const toDelete = allSlides.filter((_, i) => !KEEP.has(i));
    for (const name of toDelete) {
      zip.remove(name);
      const rel = name.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels");
      zip.remove(rel);
    }

    // ── Mise à jour presentation.xml (retirer les sldId supprimés) ────────
    const presXml  = await zip.file("ppt/presentation.xml")?.async("string") ?? "";
    const presRels = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string") ?? "";

    // Construire map rId → slideName
    const ridMap = new Map<string, string>();
    const rrr = /Id="(rId\d+)"[^>]*Target="slides\/(slide\d+\.xml)"/g;
    let rr: RegExpExecArray | null;
    while ((rr = rrr.exec(presRels)) !== null)
      ridMap.set(rr[1], `ppt/slides/${rr[2]}`);

    // Slides encore présentes
    const remainingSlides = new Set(Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)));
    const keptRIds = new Set(Array.from(ridMap.entries()).filter(([,f]) => remainingSlides.has(f)).map(([rid])=>rid));

    const newPres = presXml.replace(/<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/, (_,inner) => {
      const filtered = inner.replace(/<p:sldId[^/]*\/>/g, (tag: string) => {
        const rm = tag.match(/r:id="([^"]+)"/);
        return rm && keptRIds.has(rm[1]) ? tag : "";
      });
      return `<p:sldIdLst>${filtered}</p:sldIdLst>`;
    });
    zip.file("ppt/presentation.xml", newPres);

    // ── Dupliquer la slide événement si > 3 sections ─────────────────────
    const nChunks = Math.max(1, Math.ceil(secs.length / 3));
    const evSlideName = allSlides[evIdx];
    const evSlideNames: string[] = [evSlideName];

    for (let ci = 1; ci < nChunks; ci++) {
      const newName = `ppt/slides/slide_ext${ci}.xml`;
      await duplicateSlide(zip, evSlideName, newName);
      evSlideNames.push(newName);
    }

    // ── Remplissage Cover ─────────────────────────────────────────────────
    const coverName = allSlides[0];
    const coverXml  = await zip.file(coverName)?.async("string") ?? "";
    zip.file(coverName, fillCover(coverXml, devis));

    // ── Remplissage slides événement ─────────────────────────────────────
    for (let ci = 0; ci < evSlideNames.length; ci++) {
      const chunk  = secs.slice(ci*3, ci*3+3);
      const evBase = await zip.file(evSlideName)?.async("string") ?? "";
      const filled = fillEvent(evBase, devis, chunk, ci*3);
      zip.file(evSlideNames[ci], filled);
    }

    // ── Remplissage Récapitulatif ─────────────────────────────────────────
    const rcName = allSlides[rcIdx];
    const rcXml  = await zip.file(rcName)?.async("string") ?? "";
    zip.file(rcName, fillRecap(rcXml, devis, secs));

    // ── Remplissage Acompte ───────────────────────────────────────────────
    const acName = allSlides[acIdx];
    const acXml  = await zip.file(acName)?.async("string") ?? "";
    zip.file(acName, fillAcompte(acXml, devis, secs));

    // ── Renumérotation de toutes les slides restantes ─────────────────────
    const finalSlides = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide[^/]+\.xml$/.test(n) && !n.includes("_rels"))
      .sort((a,b) => {
        const na = parseInt(a.match(/\d+/)?.[0] ?? "999");
        const nb = parseInt(b.match(/\d+/)?.[0] ?? "999");
        return na - nb;
      });

    for (let pi = 0; pi < finalSlides.length; pi++) {
      const fname = finalSlides[pi];
      const sxml  = await zip.file(fname)?.async("string") ?? "";
      zip.file(fname, renumberPage(sxml, pi+1));
    }

    // ── Export ────────────────────────────────────────────────────────────
    const buf = await zip.generateAsync({ type:"nodebuffer", compression:"DEFLATE", compressionOptions:{level:6} });

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${ref}.pptx"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pptx]", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  }
}
