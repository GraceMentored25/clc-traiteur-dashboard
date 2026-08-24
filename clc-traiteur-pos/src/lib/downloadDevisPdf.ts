import type { Devis } from "@/lib/types";

export type DevisPdfPayload = Devis & {
  lieu?: string;
  brandNom?: string;
  brandSousTitre?: string;
  brandVille?: string;
};

/** Ouvre le devis HTML (template devis_modele.html) dans un nouvel onglet pour impression PDF. */
export async function downloadDevisPdf(devis: DevisPdfPayload): Promise<void> {
  const factConfig = (() => {
    try { return JSON.parse(localStorage.getItem("clc-facturation-config") ?? "{}"); }
    catch { return {}; }
  })();

  const payload: DevisPdfPayload = {
    ...devis,
    brandNom:       devis.brandNom       ?? factConfig.nom       ?? "CLC TRAITEUR",
    brandSousTitre: devis.brandSousTitre ?? factConfig.sousTitre ?? "Traiteur événementiel",
    brandVille:       devis.brandVille       ?? factConfig.ville       ?? "Rouen",
  };

  const win = window.open("", "_blank");
  if (!win) {
    alert("Veuillez autoriser les popups pour générer le PDF.");
    return;
  }

  win.document.write("<html><body style='font-family:sans-serif;padding:40px;color:#555'>Génération du PDF en cours…</body></html>");

  const res = await fetch("/api/devis/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    win.close();
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }

  const html = await res.text();
  win.document.open();
  win.document.write(html);
  win.document.close();
}
