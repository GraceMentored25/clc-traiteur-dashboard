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

// ── setShapeText : split sur <p:sp>, remplace le premier <a:t> ─────────────
function setShapeText(xml: string, shapeName: string, value: string): string {
  const parts = xml.split("<p:sp>");
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end < 0) continue;
    if (!parts[i].slice(0, end).includes(`name="${shapeName}"`)) continue;
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

// ── Supprimer un shape p:sp par nom ────────────────────────────────────────
function removeShape(xml: string, shapeName: string): string {
  const parts = xml.split("<p:sp>");
  const kept: string[] = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end >= 0 && parts[i].slice(0, end).includes(`name="${shapeName}"`)) continue;
    kept.push(parts[i]);
  }
  return kept.join("<p:sp>");
}

// ── Supprimer une image p:pic par nom ──────────────────────────────────────
function removePic(xml: string, picName: string): string {
  const parts = xml.split("<p:pic>");
  const kept: string[] = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf("</p:pic>");
    if (end >= 0 && parts[i].slice(0, end).includes(`name="${picName}"`)) continue;
    kept.push(parts[i]);
  }
  return kept.join("<p:pic>");
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
  return Array.from(map.entries()).map(([label,its]) => ({
    label, items: its,
    subtotal: its.reduce((s,i)=>s+i.quantity*i.unitPrice, 0),
  }));
}

// ── Mapping événement → index slide ───────────────────────────────────────
const EVENT_MAP: Record<string,[number,number,number]> = {
  "mariage":[1,7,8], "anniversaire":[2,9,10], "baby shower":[3,11,12],
  "séminaire":[4,13,14], "seminaire":[4,13,14],
  "réception privée":[5,15,16], "reception privee":[5,15,16],
};
function matchEvent(et: string): [number,number,number] {
  const e = et.toLowerCase().trim();
  for (const [k,v] of Object.entries(EVENT_MAP))
    if (e.includes(k)||k.includes(e)) return v;
  return [1,7,8];
}

// ── Slots sections événement ───────────────────────────────────────────────
const SLOTS = [
  { title:"Rectangle 16",desc:"Rectangle 17",sub:"Rectangle 20",
    plats:[["Rectangle 22","Rectangle 23"],["Rectangle 25","Rectangle 26"],
           ["Rectangle 28","Rectangle 29"],["Rectangle 31","Rectangle 32"]] },
  { title:"Rectangle 36",desc:"Rectangle 37",sub:"Rectangle 40",
    plats:[["Rectangle 42","Rectangle 43"],["Rectangle 45","Rectangle 46"],
           ["Rectangle 48","Rectangle 49"],["Rectangle 51","Rectangle 52"]] },
  { title:"Rectangle 56",desc:"Rectangle 57",sub:"Rectangle 60",
    plats:[["Rectangle 62","Rectangle 63"],["Rectangle 65","Rectangle 66"],
           ["Rectangle 68","Rectangle 69"]] },
];

// ── Mapping catégorie → pictogramme de la légende ─────────────────────────
// Graphique 59=Entrées, 63=Veloutés, 67=Plats cuisinés, 71=Viandes,
// 75=Poissons, 79=Desserts, 83=Boissons, 87=Eaux, 91=Cafés, 95=Boulangerie, 99=Fruits
// Shapes texte associés : Rectangle 8/9, 12/13, 16/17, 20/21, 24/25, 28/29, 32/33, 36/37, 40/41, 44/45, 48/49
const LEGEND_ROWS: {
  pic: string;
  titleShape: string;
  descShape: string;
  categories: string[];
  titleText: string;
}[] = [
  { pic:"Graphique 59", titleShape:"Rectangle 8",  descShape:"Rectangle 9",
    categories:["Entrées"], titleText:"Entrées & légumes frais" },
  { pic:"Graphique 63", titleShape:"Rectangle 12", descShape:"Rectangle 13",
    categories:[], titleText:"Veloutés & potages" }, // non utilisé dans notre catalogue
  { pic:"Graphique 67", titleShape:"Rectangle 16", descShape:"Rectangle 17",
    categories:["Repas","Accompagnements"], titleText:"Plats cuisinés" },
  { pic:"Graphique 71", titleShape:"Rectangle 20", descShape:"Rectangle 21",
    categories:["Grillades"], titleText:"Viandes & grillades" },
  { pic:"Graphique 75", titleShape:"Rectangle 24", descShape:"Rectangle 25",
    categories:["Poissons"], titleText:"Poissons" },
  { pic:"Graphique 79", titleShape:"Rectangle 28", descShape:"Rectangle 29",
    categories:["Desserts"], titleText:"Desserts & pâtisseries" },
  { pic:"Graphique 83", titleShape:"Rectangle 32", descShape:"Rectangle 33",
    categories:["Cocktails & Boissons"], titleText:"Boissons & cocktails" },
  { pic:"Graphique 87", titleShape:"Rectangle 36", descShape:"Rectangle 37",
    categories:[], titleText:"Eaux & boissons fraîches" },
  { pic:"Graphique 91", titleShape:"Rectangle 40", descShape:"Rectangle 41",
    categories:[], titleText:"Cafés, thés & infusions" },
  { pic:"Graphique 95", titleShape:"Rectangle 44", descShape:"Rectangle 45",
    categories:["Apéritif"], titleText:"Apéritif & boulangerie" },
  { pic:"Graphique 99", titleShape:"Rectangle 48", descShape:"Rectangle 49",
    categories:[], titleText:"Fruits & frais" },
];

// ── Services disponibles dans l'app (dishes.ts) ───────────────────────────
const APP_SERVICES: { name: string; price: number; unit: string; desc: string }[] = [
  { name:"Serveurs",           price:80,  unit:"personne",   desc:"Service en salle par personne" },
  { name:"Marmites chauffantes",price:25,  unit:"pièce",     desc:"Location de marmites chauffantes" },
  { name:"Service de table",   price:15,  unit:"couvert",    desc:"Vaisselle, couverts, nappes" },
  { name:"Tentes & Chapiteaux",price:150, unit:"unité",      desc:"Location de tentes ou chapiteaux" },
  { name:"Tables",             price:12,  unit:"table",      desc:"Location de tables" },
  { name:"Chaises",            price:3,   unit:"chaise",     desc:"Location de chaises" },
  { name:"Déco florale",       price:120, unit:"table",      desc:"Décoration florale de tables" },
  { name:"Transport & Livraison",price:60,unit:"trajet",     desc:"Livraison des plats et matériel" },
  { name:"Sono & Animation",   price:250, unit:"événement",  desc:"Système sonore, micro, animation" },
  { name:"Photographe",        price:400, unit:"événement",  desc:"Reportage photo professionnel" },
];

// Mapping template prestation → nom service app
const PRESTATION_TEMPLATE: {
  titleShape: string; descShape: string; priceShape: string;
  roundedShapes: string[]; pic: string; defaultName: string;
}[] = [
  { titleShape:"Rectangle 10", descShape:"Rectangle 11", priceShape:"Rectangle 12",
    roundedShapes:["Rectangle : coins arrondis 7","Rectangle : coins arrondis 8"],
    pic:"Graphique 67", defaultName:"Service & personnel" },
  { titleShape:"Rectangle 17", descShape:"Rectangle 18", priceShape:"Rectangle 19",
    roundedShapes:["Rectangle : coins arrondis 14","Rectangle : coins arrondis 15"],
    pic:"Graphique 74", defaultName:"Location de matériel" },
  { titleShape:"Rectangle 23", descShape:"Rectangle 24", priceShape:"Rectangle 25",
    roundedShapes:["Rectangle : coins arrondis 21","Rectangle : coins arrondis 22"],
    pic:"", defaultName:"Livraison" },
  { titleShape:"Rectangle 30", descShape:"Rectangle 31", priceShape:"Rectangle 32",
    roundedShapes:["Rectangle : coins arrondis 27","Rectangle : coins arrondis 28"],
    pic:"Graphique 87", defaultName:"Décoration de table" },
  { titleShape:"Rectangle 36", descShape:"Rectangle 37", priceShape:"Rectangle 38",
    roundedShapes:["Rectangle : coins arrondis 34","Rectangle : coins arrondis 35"],
    pic:"", defaultName:"Location de tente" },
  { titleShape:"Rectangle 42", descShape:"Rectangle 43", priceShape:"Rectangle 44",
    roundedShapes:["Rectangle : coins arrondis 40","Rectangle : coins arrondis 41"],
    pic:"Graphique 110", defaultName:"Animation musicale" },
  { titleShape:"Rectangle 48", descShape:"Rectangle 49", priceShape:"Rectangle 50",
    roundedShapes:["Rectangle : coins arrondis 46","Rectangle : coins arrondis 47"],
    pic:"", defaultName:"Gâteau sur mesure" },
];

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

// ── Remplissage slide événement ───────────────────────────────────────────
function fillEvent(xml: string, d: Devis & {lieu?:string}, chunk: Section[], offset: number): string {
  xml = setShapeText(xml,"Rectangle 4",d.eventType.toUpperCase());
  xml = setShapeText(xml,"Rectangle 6",`${d.guestCount} convives`);
  xml = setShapeText(xml,"Rectangle 9",fmtDate(d.eventDate));
  xml = setShapeText(xml,"Rectangle 12",d.lieu??"France");
  let total = 0;
  for (let si = 0; si < SLOTS.length; si++) {
    const slot = SLOTS[si];
    if (si < chunk.length) {
      const sec = chunk[si]; total += sec.subtotal;
      xml = setShapeText(xml,slot.title,`${offset+si+1}. ${sec.label}`);
      xml = setShapeText(xml,slot.desc,"");
      xml = setShapeText(xml,slot.sub,fmtMoney(sec.subtotal));
      for (let pi = 0; pi < slot.plats.length; pi++) {
        const [pn,cn] = slot.plats[pi];
        if (pi < sec.items.length) {
          xml = setShapeText(xml,pn,sec.items[pi].dishName);
          xml = setShapeText(xml,cn,`${sec.items[pi].quantity} convives`);
        } else {
          xml = setShapeText(xml,pn,""); xml = setShapeText(xml,cn,"");
        }
      }
    } else {
      xml = setShapeText(xml,slot.title,""); xml = setShapeText(xml,slot.desc,"");
      xml = setShapeText(xml,slot.sub,"");
      for (const [pn,cn] of slot.plats) { xml = setShapeText(xml,pn,""); xml = setShapeText(xml,cn,""); }
    }
  }
  xml = setShapeText(xml,"Rectangle 72",fmtMoney(total));
  xml = setShapeText(xml,"Rectangle 75",fmtMoney(total));
  return xml;
}

// ── Remplissage récapitulatif ─────────────────────────────────────────────
function fillRecap(xml: string, d: Devis & {lieu?:string}, secs: Section[]): string {
  const totalEv = secs.reduce((s,x)=>s+x.subtotal,0);
  xml = setShapeText(xml,"Rectangle 5",d.eventType.toUpperCase());
  xml = setShapeText(xml,"Rectangle 7",`${d.guestCount} convives`);
  xml = setShapeText(xml,"Rectangle 9",fmtDate(d.eventDate));
  xml = setShapeText(xml,"Rectangle 11",d.lieu??"France");
  const rows = [
    ["Rectangle 15","Rectangle 16","Rectangle 17","Rectangle 18"],
    ["Rectangle 21","Rectangle 22","Rectangle 23","Rectangle 24"],
    ["Rectangle 27","Rectangle 28","Rectangle 29","Rectangle 30"],
  ];
  for (let ri=0; ri<rows.length; ri++) {
    const [rn,rl,rd,rp]=rows[ri];
    if (ri<secs.length) {
      const s=secs[ri];
      xml=setShapeText(xml,rn,String(ri+1)); xml=setShapeText(xml,rl,s.label);
      xml=setShapeText(xml,rd,""); xml=setShapeText(xml,rp,fmtMoney(s.subtotal));
    } else { for (const n of [rn,rl,rd,rp]) xml=setShapeText(xml,n,""); }
  }
  xml = setShapeText(xml,"Rectangle 33",fmtMoney(totalEv));
  xml = setShapeText(xml,"Rectangle 55",fmtMoney(d.totalTTC));
  return xml;
}

// ── Remplissage acompte ───────────────────────────────────────────────────
function fillAcompte(xml: string, d: Devis, secs: Section[]): string {
  const totalEv = secs.reduce((s,x)=>s+x.subtotal,0);
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

// ── Remplissage slide Prestations (slide7) ────────────────────────────────
// Les items Services du devis (category="Services")
function fillPrestations(xml: string, serviceItems: DevisItem[]): string {
  // Construire un index nom → item pour les services sélectionnés
  const selectedMap = new Map<string, DevisItem>();
  for (const item of serviceItems) {
    selectedMap.set(item.dishName.toLowerCase(), item);
  }

  // Matcher chaque slot du template avec les services sélectionnés
  // On essaie de faire correspondre par mot-clé
  const matchService = (defaultName: string): DevisItem | null => {
    const dn = defaultName.toLowerCase();
    for (const [key, item] of selectedMap.entries()) {
      if (dn.includes(key.slice(0,6)) || key.includes(dn.slice(0,6))) return item;
    }
    // Matching par les services app
    for (const svc of APP_SERVICES) {
      const sn = svc.name.toLowerCase();
      if (dn.includes(sn.slice(0,5)) || sn.includes(dn.slice(0,5))) {
        return selectedMap.get(sn) ?? null;
      }
    }
    return null;
  };

  let subtotal = 0;

  for (const slot of PRESTATION_TEMPLATE) {
    const matched = matchService(slot.defaultName);
    if (matched) {
      // Prestation sélectionnée : remplir avec les vraies données
      const svc = APP_SERVICES.find(s => s.name.toLowerCase() === matched.dishName.toLowerCase())
        ?? APP_SERVICES.find(s => matched.dishName.toLowerCase().includes(s.name.toLowerCase().slice(0,6)));
      xml = setShapeText(xml, slot.titleShape, matched.dishName);
      xml = setShapeText(xml, slot.descShape,
        `${matched.quantity} ${svc?.unit ?? "unité"} — ${svc?.desc ?? ""}`);
      const total = matched.quantity * matched.unitPrice;
      xml = setShapeText(xml, slot.priceShape, fmtMoney(total));
      subtotal += total;
    } else {
      // Prestation non sélectionnée : vider les textes
      xml = setShapeText(xml, slot.titleShape, "");
      xml = setShapeText(xml, slot.descShape, "");
      xml = setShapeText(xml, slot.priceShape, "");
    }
  }

  xml = setShapeText(xml, "Rectangle 56", fmtMoney(subtotal));
  return xml;
}

// ── Remplissage légende (slide20) ─────────────────────────────────────────
// Met à jour chaque rangée avec les plats réels du devis
// Si une catégorie n'est pas dans le devis → supprimer la rangée
function fillLegende(xml: string, allItems: DevisItem[]): string {
  // Construire la liste des plats par catégorie à partir des items du devis
  // On déduit la catégorie du nom du plat via dishName (on n'a pas la category dans DevisItem)
  // On va grouper par "section" et lister les noms — suffisant pour la légende

  // Tous les noms de plats uniques (hors services)
  const allDishNames = [...new Set(allItems
    .filter(i => !APP_SERVICES.some(s => s.name.toLowerCase() === i.dishName.toLowerCase()))
    .map(i => i.dishName))];

  // Pour la légende, on liste simplement tous les plats du devis sous "Plats cuisinés"
  // et on vide les rangées non utilisées
  // Approche simple : mettre tous les plats dans Rectangle 17 (Plats cuisinés)
  // et vider les autres rangées inutilisées

  // Les sections réelles
  const sectionNames = [...new Set(allItems.filter(i=>i.section).map(i=>i.section!))];

  // Identifier quelles catégories sont présentes (approche par nom de plat)
  // On ne connaît pas la category exacte ici, mais on peut inférer depuis les noms
  const hasBoissons = allItems.some(i =>
    i.dishName.toLowerCase().includes("jus") ||
    i.dishName.toLowerCase().includes("bissap") ||
    i.dishName.toLowerCase().includes("cocktail") ||
    i.dishName.toLowerCase().includes("gingembre")
  );
  const hasDesserts = allItems.some(i =>
    i.dishName.toLowerCase().includes("gâteau") ||
    i.dishName.toLowerCase().includes("crêpe") ||
    i.dishName.toLowerCase().includes("dessert") ||
    i.dishName.toLowerCase().includes("croquette") ||
    i.dishName.toLowerCase().includes("caramel")
  );
  const hasAperitif = allItems.some(i =>
    i.dishName.toLowerCase().includes("nem") ||
    i.dishName.toLowerCase().includes("pastel") ||
    i.dishName.toLowerCase().includes("beignet") ||
    i.dishName.toLowerCase().includes("brochette") ||
    i.dishName.toLowerCase().includes("plantain")
  );

  // Mettre à jour Rectangle 17 (Plats cuisinés) avec les plats principaux
  const mainDishes = allDishNames.filter(n =>
    !n.toLowerCase().includes("jus") && !n.toLowerCase().includes("bissap") &&
    !n.toLowerCase().includes("gâteau") && !n.toLowerCase().includes("crêpe") &&
    !n.toLowerCase().includes("nem") && !n.toLowerCase().includes("pastel") &&
    !n.toLowerCase().includes("beignet") && !n.toLowerCase().includes("brochette")
  );
  if (mainDishes.length > 0) {
    xml = setShapeText(xml, "Rectangle 17", mainDishes.join(" · "));
  } else {
    xml = removeShape(xml, "Graphique 67");
    xml = removeShape(xml, "Rectangle 16");
    xml = removeShape(xml, "Rectangle 17");
  }

  // Boissons
  const boissonsNames = allItems
    .filter(i => i.dishName.toLowerCase().includes("jus") ||
                 i.dishName.toLowerCase().includes("bissap") ||
                 i.dishName.toLowerCase().includes("gingembre"))
    .map(i => i.dishName);
  if (boissonsNames.length > 0) {
    xml = setShapeText(xml, "Rectangle 33", [...new Set(boissonsNames)].join(" · "));
  } else {
    xml = removeShape(xml, "Graphique 83");
    xml = removeShape(xml, "Rectangle 32");
    xml = removeShape(xml, "Rectangle 33");
  }

  // Desserts
  const dessertNames = allItems
    .filter(i => i.dishName.toLowerCase().includes("gâteau") ||
                 i.dishName.toLowerCase().includes("crêpe") ||
                 i.dishName.toLowerCase().includes("caramel") ||
                 i.dishName.toLowerCase().includes("croquette"))
    .map(i => i.dishName);
  if (dessertNames.length > 0) {
    xml = setShapeText(xml, "Rectangle 29", [...new Set(dessertNames)].join(" · "));
  } else {
    xml = removeShape(xml, "Graphique 79");
    xml = removeShape(xml, "Rectangle 28");
    xml = removeShape(xml, "Rectangle 29");
  }

  // Apéritif
  const aperitifNames = allItems
    .filter(i => i.dishName.toLowerCase().includes("nem") ||
                 i.dishName.toLowerCase().includes("pastel") ||
                 i.dishName.toLowerCase().includes("beignet") ||
                 i.dishName.toLowerCase().includes("brochette") ||
                 i.dishName.toLowerCase().includes("plantain") ||
                 i.dishName.toLowerCase().includes("crudité"))
    .map(i => i.dishName);
  if (aperitifNames.length > 0) {
    xml = setShapeText(xml, "Rectangle 45", [...new Set(aperitifNames)].join(" · "));
    xml = setShapeText(xml, "Rectangle 44", "Apéritif & bouchées");
  } else {
    xml = removeShape(xml, "Graphique 95");
    xml = removeShape(xml, "Rectangle 44");
    xml = removeShape(xml, "Rectangle 45");
  }

  // Rangées rarement utilisées dans notre catalogue → supprimer
  // Veloutés (Rectangle 12/13), Viandes (20/21), Poissons (24/25),
  // Eaux (36/37), Cafés (40/41), Fruits (48/49)
  for (const [pic, t, d] of [
    ["Graphique 63","Rectangle 12","Rectangle 13"],
    ["Graphique 71","Rectangle 20","Rectangle 21"],
    ["Graphique 75","Rectangle 24","Rectangle 25"],
    ["Graphique 87","Rectangle 36","Rectangle 37"],
    ["Graphique 91","Rectangle 40","Rectangle 41"],
    ["Graphique 99","Rectangle 48","Rectangle 49"],
  ] as [string,string,string][]) {
    xml = removeShape(xml, pic);
    xml = removeShape(xml, t);
    xml = removeShape(xml, d);
  }

  return xml;
}

// ── Renumérotation pages ──────────────────────────────────────────────────
function renumberPage(xml: string, pageNum: number): string {
  const parts = xml.split("<p:sp>");
  let maxN = -1; let maxIdx = -1;
  const ellipseNums: {idx:number; n:number}[] = [];
  for (let i = 1; i < parts.length; i++) {
    const end = parts[i].indexOf("</p:sp>");
    if (end < 0) continue;
    const sp = parts[i].slice(0, end);
    if (!sp.includes("Ellipse")) continue;
    const atM = sp.match(/<a:t>(\d+)<\/a:t>/);
    if (!atM) continue;
    const n = parseInt(atM[1]);
    ellipseNums.push({idx:i, n});
    if (n > maxN) { maxN = n; maxIdx = i; }
  }
  if (maxIdx > 0) {
    parts[maxIdx] = parts[maxIdx].replace(/<a:t>\d+<\/a:t>/, `<a:t>${pageNum}</a:t>`);
  }
  return parts.join("<p:sp>");
}

// ── Dupliquer slide ───────────────────────────────────────────────────────
async function duplicateSlide(zip: JSZip, sourceName: string, newName: string) {
  const srcXml = await zip.file(sourceName)?.async("string") ?? "";
  zip.file(newName, srcXml);
  const srcRel = sourceName.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels");
  const relXml = await zip.file(srcRel)?.async("string");
  if (relXml) {
    zip.file(newName.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels"), relXml);
  }
}

// ── API Route ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const devis = await req.json() as Devis & { lieu?: string };
    const ref   = devis.id.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Séparer items services vs plats
    const serviceItems = devis.items.filter(i =>
      APP_SERVICES.some(s => i.dishName.toLowerCase().includes(s.name.toLowerCase().slice(0,5)) ||
                             s.name.toLowerCase().includes(i.dishName.toLowerCase().slice(0,5)))
    );
    const dishItems = devis.items.filter(i => !serviceItems.includes(i));

    const secs = groupSections(dishItems);
    const [evIdx, rcIdx, acIdx] = matchEvent(devis.eventType);

    const templateBuf = fs.readFileSync(TEMPLATE_PATH);
    const zip = await JSZip.loadAsync(templateBuf);

    const allSlides = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a,b) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]));

    // Slides à garder : cover(0), event(evIdx), prestations(6), recap(rcIdx),
    // acompte(acIdx), mentions(17), signature(18), légende(19)
    const hasServices = serviceItems.length > 0;
    const KEEP = new Set([0, evIdx, rcIdx, acIdx, 17, 18, 19]); // 19 = légende
    if (hasServices) KEEP.add(6); // prestations seulement si des services sélectionnés

    const toDelete = allSlides.filter((_,i) => !KEEP.has(i));
    for (const name of toDelete) {
      zip.remove(name);
      zip.remove(name.replace("ppt/slides/","ppt/slides/_rels/").replace(".xml",".xml.rels"));
    }

    // Mise à jour presentation.xml
    const presXml  = await zip.file("ppt/presentation.xml")?.async("string") ?? "";
    const presRels = await zip.file("ppt/_rels/presentation.xml.rels")?.async("string") ?? "";
    const ridMap = new Map<string,string>();
    for (const m of presRels.matchAll(/Id="([^"]+)"[^>]*Target="slides\/(slide\d+\.xml)"/g))
      ridMap.set(m[1], `ppt/slides/${m[2]}`);
    const remaining = new Set(Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)));
    const keptRIds = new Set(Array.from(ridMap.entries()).filter(([,f])=>remaining.has(f)).map(([rid])=>rid));
    const newPres = presXml.replace(/<p:sldIdLst>([\s\S]*?)<\/p:sldIdLst>/, (_,inner) => {
      const filtered = inner.replace(/<p:sldId[^/]*\/>/g, (tag: string) => {
        const rm = tag.match(/r:id="([^"]+)"/);
        return rm && keptRIds.has(rm[1]) ? tag : "";
      });
      return `<p:sldIdLst>${filtered}</p:sldIdLst>`;
    });
    zip.file("ppt/presentation.xml", newPres);

    // Duplication si > 3 sections
    const nChunks = Math.max(1, Math.ceil(secs.length / 3));
    const evSlideName = allSlides[evIdx];
    const evSlideNames: string[] = [evSlideName];
    for (let ci = 1; ci < nChunks; ci++) {
      const newName = `ppt/slides/slide_ext${ci}.xml`;
      await duplicateSlide(zip, evSlideName, newName);
      evSlideNames.push(newName);
    }

    // Cover
    const covXml = await zip.file(allSlides[0])?.async("string") ?? "";
    zip.file(allSlides[0], fillCover(covXml, devis));

    // Slides événement
    for (let ci = 0; ci < evSlideNames.length; ci++) {
      const base = await zip.file(evSlideName)?.async("string") ?? "";
      zip.file(evSlideNames[ci], fillEvent(base, devis, secs.slice(ci*3,ci*3+3), ci*3));
    }

    // Récapitulatif
    const rcXml = await zip.file(allSlides[rcIdx])?.async("string") ?? "";
    zip.file(allSlides[rcIdx], fillRecap(rcXml, devis, secs));

    // Acompte
    const acXml = await zip.file(allSlides[acIdx])?.async("string") ?? "";
    zip.file(allSlides[acIdx], fillAcompte(acXml, devis, secs));

    // Prestations (si services)
    if (hasServices) {
      const prXml = await zip.file(allSlides[6])?.async("string") ?? "";
      zip.file(allSlides[6], fillPrestations(prXml, serviceItems));
    }

    // Légende
    const lgXml = await zip.file(allSlides[19])?.async("string") ?? "";
    zip.file(allSlides[19], fillLegende(lgXml, devis.items));

    // Renumérotation
    const finalSlides = Object.keys(zip.files)
      .filter(n => /^ppt\/slides\/slide[^/]+\.xml$/.test(n) && !n.includes("_rels"))
      .sort((a,b)=>{
        const na=parseInt(a.match(/\d+/)?.[0]??"999");
        const nb=parseInt(b.match(/\d+/)?.[0]??"999");
        return na-nb;
      });
    for (let pi=0; pi<finalSlides.length; pi++) {
      const sxml = await zip.file(finalSlides[pi])?.async("string") ?? "";
      zip.file(finalSlides[pi], renumberPage(sxml, pi+1));
    }

    const buf = await zip.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:6}});

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition":`attachment; filename="${ref}.pptx"`,
        "Content-Length":String(buf.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pptx]", msg);
    return NextResponse.json({error:"Erreur serveur",detail:msg},{status:500});
  }
}
