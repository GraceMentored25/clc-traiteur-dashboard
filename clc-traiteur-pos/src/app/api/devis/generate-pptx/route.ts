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
  try { const [y,m,d]=iso.split("-"); return `${parseInt(d)} ${MOIS[parseInt(m)]} ${y}`; }
  catch { return iso; }
}
function fmtMoney(n: number): string { return `${Math.round(n).toLocaleString("fr-FR")} €`; }
function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
          .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

// ── Helpers XML ───────────────────────────────────────────────────────────
function setShapeText(xml: string, shapeName: string, value: string): string {
  const parts = xml.split("<p:sp>");
  for (let i=1;i<parts.length;i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end<0) continue;
    if (!parts[i].slice(0,end).includes(`name="${shapeName}"`)) continue;
    let replaced = false;
    parts[i] = parts[i].replace(/<a:t>[^<]*<\/a:t>/, () => {
      if (replaced) return "<a:t></a:t>";
      replaced = true; return `<a:t>${esc(value)}</a:t>`;
    });
    break;
  }
  return parts.join("<p:sp>");
}

function removeShape(xml: string, shapeName: string): string {
  const parts = xml.split("<p:sp>");
  const kept = [parts[0]];
  for (let i=1;i<parts.length;i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end>=0 && parts[i].slice(0,end).includes(`name="${shapeName}"`)) continue;
    kept.push(parts[i]);
  }
  return kept.join("<p:sp>");
}

function removePic(xml: string, picName: string): string {
  const parts = xml.split("<p:pic>");
  const kept = [parts[0]];
  for (let i=1;i<parts.length;i++) {
    const end = parts[i].indexOf("</p:pic>");
    if (end>=0 && parts[i].slice(0,end).includes(`name="${picName}"`)) continue;
    kept.push(parts[i]);
  }
  return kept.join("<p:pic>");
}

// Redimensionner le cy d'une shape (fond de section)
function resizeShapeCy(xml: string, shapeName: string, newCy: number): string {
  const parts = xml.split("<p:sp>");
  for (let i=1;i<parts.length;i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end<0) continue;
    if (!parts[i].slice(0,end).includes(`name="${shapeName}"`)) continue;
    parts[i] = parts[i].replace(/(<a:ext cx="\d+" cy=")(\d+)(")/,`$1${newCy}$3`);
    break;
  }
  return parts.join("<p:sp>");
}

// ── Groupement sections ───────────────────────────────────────────────────
interface Section { label: string; items: DevisItem[]; subtotal: number; }
function groupSections(items: DevisItem[]): Section[] {
  const map = new Map<string,DevisItem[]>();
  for (const item of items) {
    const key = item.section ?? "Prestation";
    if (!map.has(key)) map.set(key,[]);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([label,its])=>({
    label, items:its, subtotal:its.reduce((s,i)=>s+i.quantity*i.unitPrice,0),
  }));
}

// ── Mapping événement → indices slides ────────────────────────────────────
const EVENT_MAP: Record<string,[number,number,number]> = {
  "mariage":[1,7,8],"anniversaire":[2,9,10],"baby shower":[3,11,12],
  "séminaire":[4,13,14],"seminaire":[4,13,14],
  "réception privée":[5,15,16],"reception privee":[5,15,16],
};
function matchEvent(et: string): [number,number,number] {
  const e = et.toLowerCase().trim();
  for (const [k,v] of Object.entries(EVENT_MAP))
    if (e.includes(k)||k.includes(e)) return v;
  return [1,7,8];
}

// ── Mapping catégorie → image média (picto) ───────────────────────────────
// Basé sur l'analyse du template slide2 :
// image22 = Repas/Plats cuisinés, image26 = Entrées, image29 = Poissons,
// image31 = Viandes/Grillades, image33 = Accompagnements,
// image36 = Desserts, image38 = Boissons/Apéritif
const CAT_TO_MEDIA: Record<string,{png:string;svg:string}> = {
  "Repas":                 {png:"image22.png", svg:"image23.svg"},
  "Entrées":               {png:"image26.png", svg:"image27.svg"},
  "Poissons":              {png:"image29.png", svg:"image30.svg"},
  "Grillades":             {png:"image31.png", svg:"image32.svg"},
  "Accompagnements":       {png:"image33.png", svg:"image34.svg"},
  "Desserts":              {png:"image36.png", svg:"image37.svg"},
  "Cocktails & Boissons":  {png:"image38.png", svg:"image39.svg"},
  "Apéritif":              {png:"image22.png", svg:"image23.svg"},
  "Services":              {png:"image22.png", svg:"image23.svg"},
};
// Inférer la catégorie depuis le nom du plat
function inferCategory(dishName: string): string {
  const n = dishName.toLowerCase();
  if (n.includes("jus")||n.includes("bissap")||n.includes("cocktail")||n.includes("gingembre")) return "Cocktails & Boissons";
  if (n.includes("gâteau")||n.includes("crêpe sucrée")||n.includes("caramel")||n.includes("dessert")||n.includes("croquette")||n.includes("chin")) return "Desserts";
  if (n.includes("nem")||n.includes("pastel")||n.includes("beignet")||n.includes("brochette")||n.includes("plantain")||n.includes("crudité")||n.includes("crêpe salée")) return "Apéritif";
  if (n.includes("poisson")||n.includes("tilapia")||n.includes("bar")||n.includes("attiéké")) return "Poissons";
  if (n.includes("braisé")||n.includes("grillé")||n.includes("porc")||n.includes("boeuf")) return "Grillades";
  if (n.includes("riz")||n.includes("plantain frit")||n.includes("bobolo")||n.includes("couscous")||n.includes("tapioca")||n.includes("frites")) return "Accompagnements";
  if (n.includes("plateau")||n.includes("crudité")||n.includes("entrée")) return "Entrées";
  return "Repas";
}

// ── Services de l'app ─────────────────────────────────────────────────────
const APP_SERVICES = [
  { name:"Serveurs",            price:80,  unit:"personne",  desc:"Service en salle" },
  { name:"Marmites chauffantes",price:25,  unit:"pièce",     desc:"Location marmites chauffantes" },
  { name:"Service de table",    price:15,  unit:"couvert",   desc:"Vaisselle, couverts, nappes" },
  { name:"Tentes & Chapiteaux", price:150, unit:"unité",     desc:"Location tentes/chapiteaux" },
  { name:"Tables",              price:12,  unit:"table",     desc:"Location de tables" },
  { name:"Chaises",             price:3,   unit:"chaise",    desc:"Location de chaises" },
  { name:"Déco florale",        price:120, unit:"table",     desc:"Décoration florale" },
  { name:"Transport & Livraison",price:60, unit:"trajet",    desc:"Livraison des plats" },
  { name:"Sono & Animation",    price:250, unit:"événement", desc:"Sonorisation & animation" },
  { name:"Photographe",         price:400, unit:"événement", desc:"Reportage photo" },
];

function isService(dishName: string): boolean {
  const n = dishName.toLowerCase();
  return APP_SERVICES.some(s=>n.includes(s.name.toLowerCase().slice(0,6))||s.name.toLowerCase().includes(n.slice(0,6)));
}

// ── Template d'un pictogramme plat (basé sur Graphique 95 de slide2) ──────
// XML structure: <p:pic>...<p:blipFill><a:blip r:embed="RIDPNG">...<asvg:svgBlip r:embed="RIDSVG"/>...
function buildPicXml(id:number, name:string, rIdPng:string, rIdSvg:string, x:number, y:number, cx=200025, cy=200025): string {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rIdPng}"><a:extLst><a:ext uri="{96DAC541-7B7A-43D3-8B79-37D633B846F1}"><asvg:svgBlip xmlns:asvg="http://schemas.microsoft.com/office/drawing/2016/SVG/main" r:embed="${rIdSvg}"/></a:ext></a:extLst></a:blip><a:stretch/></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

// ── Remplissage d'une section (slot) du template ──────────────────────────
// Chaque slot a : bannière image, titre, desc, sous-total, et 3-4 lignes plats fixes
// On doit : garder les pictos existants des lignes occupées, supprimer ceux des lignes vides,
// et si plus de lignes que prévu, créer de nouvelles lignes

// Positions de référence des 3 slots (Y de la 1ère ligne plat, espacement inter-ligne)
// cy de la hauteur de bannière titre (fixe) + une ligne = 314325 EMU
const BANNER_CY   = 742950;  // fond bannière titre (coins arrondis 14/34/54)
const LINE_H      = 314325;  // hauteur d'une ligne plat
const SECTION_TOP_PADDING = 857250; // espace entre début fond et 1ère ligne (bannière + gap)

const SLOT_CONFIG = [
  { // Slot 1
    titleShape:"Rectangle 16", descShape:"Rectangle 17", subShape:"Rectangle 20",
    bannerPic:"Image 89", fondShape:"Rectangle : coins arrondis 13",
    fondBannerShape:"Rectangle : coins arrondis 14", fondY:2238375,
    lines: [
      { platShape:"Rectangle 22", convShape:"Rectangle 23", picName:"Graphique 95",  yBase:3095625 },
      { platShape:"Rectangle 25", convShape:"Rectangle 26", picName:"Graphique 98",  yBase:3409950 },
      { platShape:"Rectangle 28", convShape:"Rectangle 29", picName:"Graphique 101", yBase:3724275 },
      { platShape:"Rectangle 31", convShape:"Rectangle 32", picName:"Graphique 104", yBase:4038600 },
    ],
  },
  { // Slot 2
    titleShape:"Rectangle 36", descShape:"Rectangle 37", subShape:"Rectangle 40",
    bannerPic:"Image 109", fondShape:"Rectangle : coins arrondis 33",
    fondBannerShape:"Rectangle : coins arrondis 34", fondY:4629150,
    lines: [
      { platShape:"Rectangle 42", convShape:"Rectangle 43", picName:"Graphique 115", yBase:5486400 },
      { platShape:"Rectangle 45", convShape:"Rectangle 46", picName:"Graphique 118", yBase:5800725 },
      { platShape:"Rectangle 48", convShape:"Rectangle 49", picName:"Graphique 121", yBase:6115050 },
      { platShape:"Rectangle 51", convShape:"Rectangle 52", picName:"Graphique 124", yBase:6429375 },
    ],
  },
  { // Slot 3
    titleShape:"Rectangle 56", descShape:"Rectangle 57", subShape:"Rectangle 60",
    bannerPic:"Image 129", fondShape:"Rectangle : coins arrondis 53",
    fondBannerShape:"Rectangle : coins arrondis 54", fondY:7019925,
    lines: [
      { platShape:"Rectangle 62", convShape:"Rectangle 63", picName:"Graphique 135", yBase:7877175 },
      { platShape:"Rectangle 65", convShape:"Rectangle 66", picName:"Graphique 138", yBase:8191500 },
      { platShape:"Rectangle 68", convShape:"Rectangle 69", picName:"Graphique 141", yBase:8505825 },
    ],
  },
];

const ROW_HEIGHT = 314325; // espacement entre lignes (EMU)
const PICTO_X    = 571500;  // X fixe des pictos
const PICTO_OFFSET_Y = 47625; // picto Y = plat Y - offset

// ── Remplissage slide événement ───────────────────────────────────────────
async function fillEventSlide(zip: JSZip, slideName: string, devis: Devis & {lieu?:string},
                               chunk: Section[], chunkOffset: number, rels: Map<string,string>) {
  let xml = await zip.file(slideName)?.async("string") ?? "";

  // Header
  xml = setShapeText(xml,"Rectangle 4",devis.eventType.toUpperCase());
  xml = setShapeText(xml,"Rectangle 6",`${devis.guestCount} convives`);
  xml = setShapeText(xml,"Rectangle 9",fmtDate(devis.eventDate));
  xml = setShapeText(xml,"Rectangle 12",devis.lieu??"France");

  // Sous-total global slide
  const totalChunk = chunk.reduce((s,x)=>s+x.subtotal,0);

  for (let si=0; si<SLOT_CONFIG.length; si++) {
    const slot = SLOT_CONFIG[si];
    if (si >= chunk.length) {
      // Vider tout le slot (fond + textes + pictos)
      xml = setShapeText(xml,slot.titleShape,"");
      xml = setShapeText(xml,slot.descShape,"");
      xml = setShapeText(xml,slot.subShape,"");
      xml = removeShape(xml,slot.fondShape);
      xml = removeShape(xml,slot.fondBannerShape);
      xml = removePic(xml,slot.bannerPic);
      for (const line of slot.lines) {
        xml = setShapeText(xml,line.platShape,"");
        xml = setShapeText(xml,line.convShape,"");
        xml = removePic(xml,line.picName);
      }
      continue;
    }

    const sec = chunk[si];
    xml = setShapeText(xml,slot.titleShape,`${chunkOffset+si+1}. ${sec.label}`);
    xml = setShapeText(xml,slot.descShape,"");
    xml = setShapeText(xml,slot.subShape,fmtMoney(sec.subtotal));

    // Calculer le nombre de lignes réelles et redimensionner le fond
    const nLines = sec.items.length;
    const newCy  = BANNER_CY + SECTION_TOP_PADDING + nLines * LINE_H + 50000;
    xml = resizeShapeCy(xml, slot.fondShape, newCy);

    // Remplir les lignes du template
    for (let pi=0; pi<slot.lines.length; pi++) {
      const line = slot.lines[pi];
      if (pi < nLines) {
        const item = sec.items[pi];
        const cat  = inferCategory(item.dishName);
        const media= CAT_TO_MEDIA[cat] ?? CAT_TO_MEDIA["Repas"];
        const rIdPng = getRidForMedia(rels, media.png) ?? "";
        const rIdSvg = getRidForMedia(rels, media.svg) ?? "";
        if (rIdPng) {
          const picEscape = line.picName.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
          xml = xml.replace(
            new RegExp(`(<p:pic>[\\s\\S]*?name="${picEscape}"[\\s\\S]*?<a:blip r:embed=")([^"]+)("[\\s\\S]*?asvg:svgBlip[^>]+r:embed=")([^"]+)(")`),
            (_,pre,_r1,mid,_r2,post) => `${pre}${rIdPng}${mid}${rIdSvg}${post}`
          );
        }
        xml = setShapeText(xml,line.platShape,item.dishName);
        xml = setShapeText(xml,line.convShape,`${item.quantity} convives`);
      } else {
        // Ligne vide : supprimer picto + shapes
        xml = removePic(xml,line.picName);
        xml = removeShape(xml,line.platShape);
        xml = removeShape(xml,line.convShape);
      }
    }

    // Lignes supplémentaires si > nb lignes template
    if (nLines > slot.lines.length) {
      const lastLine = slot.lines[slot.lines.length-1];
      let insertY = lastLine.yBase + ROW_HEIGHT;
      let extraId = 200 + si * 50;
      for (let pi=slot.lines.length; pi<nLines; pi++) {
        const item = sec.items[pi];
        const cat  = inferCategory(item.dishName);
        const media= CAT_TO_MEDIA[cat] ?? CAT_TO_MEDIA["Repas"];
        const rIdPng = getRidForMedia(rels, media.png) ?? "";
        const rIdSvg = getRidForMedia(rels, media.svg) ?? "";
        if (rIdPng)
          xml = xml.replace("</p:spTree>", buildPicXml(extraId++,`Graphique Extra${si}_${pi}`,rIdPng,rIdSvg,PICTO_X,insertY-PICTO_OFFSET_Y)+"</p:spTree>");
        xml = xml.replace("</p:spTree>",
          buildTextShape(extraId++,`Plat Extra${si}_${pi}`,esc(item.dishName),885825,insertY,4267050,LINE_H,false)+
          buildTextShape(extraId++,`Conv Extra${si}_${pi}`,`${item.quantity} convives`,5267325,insertY,1524000,LINE_H,true)+
          "</p:spTree>");
        insertY += ROW_HEIGHT;
      }
    }
  }

  // Sous-total slide global
  xml = setShapeText(xml,"Rectangle 72",fmtMoney(totalChunk));
  xml = setShapeText(xml,"Rectangle 75",fmtMoney(totalChunk));

  zip.file(slideName, xml);
}

// Trouver un rId pour un fichier media dans les rels
function getRidForMedia(rels: Map<string,string>, mediaFile: string): string|undefined {
  for (const [rid,target] of rels.entries())
    if (target.includes(mediaFile)) return rid;
  return undefined;
}

// Construire une shape texte simple
function buildTextShape(id:number,name:string,text:string,x:number,y:number,cx:number,cy:number,italic=false): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="0"><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1000" b="0" i="${italic?1:0}"><a:solidFill><a:srgbClr val="2A2A2A"/></a:solidFill><a:latin typeface="Raleway"/></a:defRPr></a:pPr><a:r><a:rPr sz="1000" b="0" i="${italic?1:0}"><a:solidFill><a:srgbClr val="2A2A2A"/></a:solidFill><a:latin typeface="Raleway"/></a:rPr><a:t>${text}</a:t></a:r></a:p></p:txBody></p:sp>`;
}

// ── Remplissage cover ─────────────────────────────────────────────────────
function fillCover(xml: string, d: Devis & {lieu?:string}): string {
  xml = setShapeText(xml,"Rectangle 10",d.clientName);
  xml = setShapeText(xml,"Rectangle 13",fmtDate(d.eventDate));
  xml = setShapeText(xml,"Rectangle 16",d.eventType);
  xml = setShapeText(xml,"Rectangle 19",d.lieu??"France");
  xml = setShapeText(xml,"Rectangle 22",d.clientPhone??"");
  xml = setShapeText(xml,"Rectangle 25",d.id);
  return xml;
}

// ── Remplissage récapitulatif ─────────────────────────────────────────────
function fillRecap(xml: string, d: Devis & {lieu?:string}, secs: Section[]): string {
  const totalEv = secs.reduce((s,x)=>s+x.subtotal,0);
  xml = setShapeText(xml,"Rectangle 5",d.eventType.toUpperCase());
  xml = setShapeText(xml,"Rectangle 7",`${d.guestCount} convives`);
  xml = setShapeText(xml,"Rectangle 9",fmtDate(d.eventDate));
  xml = setShapeText(xml,"Rectangle 11",d.lieu??"France");
  const rows=[
    ["Rectangle 15","Rectangle 16","Rectangle 17","Rectangle 18"],
    ["Rectangle 21","Rectangle 22","Rectangle 23","Rectangle 24"],
    ["Rectangle 27","Rectangle 28","Rectangle 29","Rectangle 30"],
  ];
  for (let ri=0;ri<rows.length;ri++) {
    const [rn,rl,rd,rp]=rows[ri];
    if (ri<secs.length) {
      const s=secs[ri];
      xml=setShapeText(xml,rn,String(ri+1)); xml=setShapeText(xml,rl,s.label);
      xml=setShapeText(xml,rd,""); xml=setShapeText(xml,rp,fmtMoney(s.subtotal));
    } else { for (const n of [rn,rl,rd,rp]) xml=setShapeText(xml,n,""); }
  }
  xml = setShapeText(xml,"Rectangle 33",fmtMoney(totalEv));
  // Prestations additionnelles dans le recap
  xml = setShapeText(xml,"Rectangle 34","PRESTATIONS ADDITIONNELLES RETENUES");
  xml = setShapeText(xml,"Rectangle 36","Aucune prestation additionnelle");
  xml = setShapeText(xml,"Rectangle 37","—");
  xml = setShapeText(xml,"Rectangle 38","0 €");
  xml = setShapeText(xml,"Rectangle 50","0 €");
  xml = setShapeText(xml,"Rectangle 51","0 €");
  xml = setShapeText(xml,"Rectangle 55",fmtMoney(d.totalTTC));
  return xml;
}

// ── Remplissage acompte ───────────────────────────────────────────────────
function fillAcompte(xml: string, d: Devis, secs: Section[]): string {
  const totalEv=secs.reduce((s,x)=>s+x.subtotal,0);
  const ttc=d.totalTTC; const a30=Math.round(ttc*0.30); const a40=Math.round(ttc*0.40);
  xml = setShapeText(xml,"Rectangle 5",d.eventType.toUpperCase());
  xml = setShapeText(xml,"Rectangle 8",fmtMoney(ttc));
  xml = setShapeText(xml,"Rectangle 9",`${fmtMoney(totalEv)}  événement`);
  xml = setShapeText(xml,"Rectangle 14",fmtMoney(a30));
  xml = setShapeText(xml,"Rectangle 26",fmtMoney(a30));
  xml = setShapeText(xml,"Rectangle 32",fmtMoney(a40));
  xml = setShapeText(xml,"Rectangle 38",fmtMoney(a30));
  return xml;
}

// ── Remplissage Prestations (slide7) ──────────────────────────────────────
// Mapping slots template → services
const PRESTA_SLOTS = [
  { titleShape:"Rectangle 10", descShape:"Rectangle 11", priceShape:"Rectangle 12",
    checkedPic:"Graphique 67", keywords:["serveur","personnel","service & personnel"] },
  { titleShape:"Rectangle 17", descShape:"Rectangle 18", priceShape:"Rectangle 19",
    checkedPic:"Graphique 74", keywords:["matériel","couvert","table","chaise"] },
  { titleShape:"Rectangle 23", descShape:"Rectangle 24", priceShape:"Rectangle 25",
    checkedPic:"", keywords:["livraison","transport"] },
  { titleShape:"Rectangle 30", descShape:"Rectangle 31", priceShape:"Rectangle 32",
    checkedPic:"Graphique 87", keywords:["décoration","déco","floral"] },
  { titleShape:"Rectangle 36", descShape:"Rectangle 37", priceShape:"Rectangle 38",
    checkedPic:"", keywords:["tente","chapiteau"] },
  { titleShape:"Rectangle 42", descShape:"Rectangle 43", priceShape:"Rectangle 44",
    checkedPic:"Graphique 110", keywords:["animation","sono","musique","dj"] },
  { titleShape:"Rectangle 48", descShape:"Rectangle 49", priceShape:"Rectangle 50",
    checkedPic:"", keywords:["gâteau","photographe","photo"] },
];

// rId de l'image cochée et décochée dans slide7
const RID_CHECKED   = "rId4";  // image59.png
const RID_UNCHECKED = "rId12"; // image67.png
const RID_SVG_CHECKED   = "rId5";  // image60.svg
const RID_SVG_UNCHECKED = "rId13"; // image68.svg

function fillPrestations(xml: string, serviceItems: DevisItem[]): string {
  // Pour chaque slot, chercher si un service correspond
  const findService = (keywords: string[]): DevisItem|null => {
    for (const item of serviceItems) {
      const n = item.dishName.toLowerCase();
      if (keywords.some(k => n.includes(k))) return item;
    }
    return null;
  };

  let subtotal = 0;

  for (const slot of PRESTA_SLOTS) {
    const matched = findService(slot.keywords);

    if (matched) {
      // Service sélectionné : cocher + renseigner
      const svc = APP_SERVICES.find(s => matched.dishName.toLowerCase().includes(s.name.toLowerCase().slice(0,5)));
      const total = matched.quantity * matched.unitPrice;
      subtotal += total;

      xml = setShapeText(xml, slot.titleShape, matched.dishName);
      xml = setShapeText(xml, slot.descShape,
        `${matched.quantity} ${svc?.unit ?? "unité"}${matched.quantity>1?"s":""} — ${svc?.desc ?? ""}`);
      xml = setShapeText(xml, slot.priceShape, fmtMoney(total));

      // Mettre checkmark coché
      if (slot.checkedPic) {
        const picEscape = slot.checkedPic.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
        // Remplacer rId non coché → coché
        xml = xml.replace(
          new RegExp(`(<p:pic>[^]*?name="${picEscape}"[^]*?<a:blip r:embed=")${RID_UNCHECKED}("[^]*?asvg:svgBlip[^>]+r:embed=")${RID_SVG_UNCHECKED}(")`),
          `$1${RID_CHECKED}$2${RID_SVG_CHECKED}$3`
        );
      }
    } else {
      // Service non sélectionné : décocher (s'assurer que le checkmark est décoché)
      if (slot.checkedPic) {
        const picEscape = slot.checkedPic.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
        xml = xml.replace(
          new RegExp(`(<p:pic>[^]*?name="${picEscape}"[^]*?<a:blip r:embed=")${RID_CHECKED}("[^]*?asvg:svgBlip[^>]+r:embed=")${RID_SVG_CHECKED}(")`),
          `$1${RID_UNCHECKED}$2${RID_SVG_UNCHECKED}$3`
        );
      }
      // Vider les textes
      xml = setShapeText(xml, slot.titleShape, "");
      xml = setShapeText(xml, slot.descShape, "");
      xml = setShapeText(xml, slot.priceShape, "");
    }
  }

  xml = setShapeText(xml, "Rectangle 56", fmtMoney(subtotal));
  // Si aucune prestation sélectionnée, l'indiquer dans le sous-titre
  if (subtotal === 0) {
    xml = setShapeText(xml, "Rectangle 5", "Aucune prestation additionnelle sélectionnée pour cet événement.");
  }
  return xml;
}

// ── Renumérotation pages ──────────────────────────────────────────────────
function renumberPage(xml: string, pageNum: number): string {
  const parts = xml.split("<p:sp>");
  let maxN=-1; let maxIdx=-1;
  for (let i=1;i<parts.length;i++) {
    const end=parts[i].indexOf("</p:sp>");
    if (end<0) continue;
    const sp=parts[i].slice(0,end);
    if (!sp.includes("Ellipse")) continue;
    const atM=sp.match(/<a:t>(\d+)<\/a:t>/);
    if (!atM) continue;
    const n=parseInt(atM[1]);
    if (n>maxN) { maxN=n; maxIdx=i; }
  }
  if (maxIdx>0)
    parts[maxIdx]=parts[maxIdx].replace(/<a:t>\d+<\/a:t>/,`<a:t>${pageNum}</a:t>`);
  return parts.join("<p:sp>");
}

// ── Dupliquer slide ───────────────────────────────────────────────────────
async function duplicateSlide(zip: JSZip, sourceName: string, newName: string) {
  const srcXml = await zip.file(sourceName)?.async("string") ?? "";
  zip.file(newName, srcXml);
  const srcRel = sourceName.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels");
  const relXml = await zip.file(srcRel)?.async("string");
  if (relXml)
    zip.file(newName.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels"), relXml);
}

// ── API Route ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };
    const ref   = devis.id.replace(/[^a-zA-Z0-9_-]/g,"_");

    const serviceItems = devis.items.filter(i=>isService(i.dishName));
    const dishItems    = devis.items.filter(i=>!isService(i.dishName));
    const secs = groupSections(dishItems);
    const [evIdx,rcIdx,acIdx] = matchEvent(devis.eventType);

    const templateBuf = fs.readFileSync(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(templateBuf);

    const allSlides = Object.keys(zip.files)
      .filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b)=>parseInt(a.match(/\d+/)![0])-parseInt(b.match(/\d+/)![0]));

    // Slides à garder : cover(0), event(evIdx), prestations(6) TOUJOURS,
    // recap(rcIdx), acompte(acIdx), mentions(17), signature(18)
    // Légende(19) = SUPPRIMÉE du fichier final
    const hasServices = serviceItems.length>0;
    const KEEP = new Set([0,evIdx,6,rcIdx,acIdx,17,18]); // slide prestations toujours incluse

    const toDelete = allSlides.filter((_,i)=>!KEEP.has(i));
    for (const name of toDelete) {
      zip.remove(name);
      zip.remove(name.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels"));
    }

    // Mise à jour presentation.xml
    const presXml  = await zip.file("ppt/presentation.xml")?.async("string")??"";
    const presRels = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string")??"";
    const ridMap = new Map<string,string>();
    for (const m of presRels.matchAll(/Id="([^"]+)"[^>]*Target="slides\/(slide\d+\.xml)"/g))
      ridMap.set(m[1],`ppt/slides/${m[2]}`);
    const remaining = new Set(Object.keys(zip.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)));
    const keptRIds = new Set(Array.from(ridMap.entries()).filter(([,f])=>remaining.has(f)).map(([rid])=>rid));
    const newPres = presXml.replace(/<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/,(_,inner)=>{
      const filtered=inner.replace(/<p:sldId[^/]*\/>/g,(tag:string)=>{
        const rm=tag.match(/r:id="([^"]+)"/);
        return rm&&keptRIds.has(rm[1])?tag:"";
      });
      return `<p:sldIdLst>${filtered}</p:sldIdLst>`;
    });
    zip.file("ppt/presentation.xml",newPres);

    // Rels de la slide événement (pour résoudre les media)
    const evRelsStr = await zip.file(
      allSlides[evIdx].replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels")
    )?.async("string")??"";
    const evRels = new Map<string,string>();
    for (const m of evRelsStr.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g))
      evRels.set(m[1], m[2].replace("../media/",""));

    // Duplication si > 3 sections
    const nChunks = Math.max(1,Math.ceil(secs.length/3));
    const evSlideName = allSlides[evIdx];
    const evSlideNames = [evSlideName];
    for (let ci=1;ci<nChunks;ci++) {
      const newName=`ppt/slides/slide_ext${ci}.xml`;
      await duplicateSlide(zip,evSlideName,newName);
      evSlideNames.push(newName);
    }

    // Cover
    const covXml = await zip.file(allSlides[0])?.async("string")??"";
    zip.file(allSlides[0],fillCover(covXml,devis));

    // Slides événement
    for (let ci=0;ci<evSlideNames.length;ci++)
      await fillEventSlide(zip,evSlideNames[ci],devis,secs.slice(ci*3,ci*3+3),ci*3,evRels);

    // Récapitulatif
    const rcXml = await zip.file(allSlides[rcIdx])?.async("string")??"";
    zip.file(allSlides[rcIdx],fillRecap(rcXml,devis,secs));

    // Acompte
    const acXml = await zip.file(allSlides[acIdx])?.async("string")??"";
    zip.file(allSlides[acIdx],fillAcompte(acXml,devis,secs));

    // Prestations (toujours présente — vide si aucun service)
    const prXml = await zip.file(allSlides[6])?.async("string")??"";
    zip.file(allSlides[6],fillPrestations(prXml,serviceItems));

    // Renumérotation
    const finalSlides = Object.keys(zip.files)
      .filter(n=>/^ppt\/slides\/slide[^/]+\.xml$/.test(n)&&!n.includes("_rels"))
      .sort((a,b)=>parseInt(a.match(/\d+/)?.[0]??"999")-parseInt(b.match(/\d+/)?.[0]??"999"));
    for (let pi=0;pi<finalSlides.length;pi++) {
      const sxml = await zip.file(finalSlides[pi])?.async("string")??"";
      zip.file(finalSlides[pi],renumberPage(sxml,pi+1));
    }

    const buf = await zip.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:6}});
    return new NextResponse(buf as unknown as BodyInit, {
      status:200,
      headers:{
        "Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition":`attachment; filename="${ref}.pptx"`,
        "Content-Length":String(buf.length),
      },
    });
  } catch (err:unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pptx]",msg);
    return NextResponse.json({error:"Erreur serveur",detail:msg},{status:500});
  }
}
