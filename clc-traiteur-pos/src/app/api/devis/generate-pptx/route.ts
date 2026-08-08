import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  let tmpJson = "";
  let tmpPptx = "";

  try {
    const devis = await req.json();
    const ref   = (devis.id as string).replace(/[^a-zA-Z0-9_-]/g, "_");

    // Fichiers temporaires
    const tmpDir = os.tmpdir();
    tmpJson = path.join(tmpDir, `devis_${ref}.json`);
    tmpPptx = path.join(tmpDir, `${ref}.pptx`);

    // Écrire le JSON du devis
    fs.writeFileSync(tmpJson, JSON.stringify(devis, null, 2), "utf-8");

    // Chemin du script Python (à la racine du projet)
    const scriptPath = path.join(process.cwd(), "fill_devis.py");

    // Exécuter le script
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${tmpJson}" "${tmpPptx}"`,
      { timeout: 30_000 }
    );

    if (stderr && !stdout.startsWith("OK:")) {
      console.error("[generate-pptx] stderr:", stderr);
    }

    if (!fs.existsSync(tmpPptx)) {
      return NextResponse.json(
        { error: "Échec génération PPTX", detail: stderr },
        { status: 500 }
      );
    }

    const buffer = fs.readFileSync(tmpPptx);
    const filename = `${ref}.pptx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-pptx] error:", msg);
    return NextResponse.json({ error: "Erreur serveur", detail: msg }, { status: 500 });
  } finally {
    // Nettoyage fichiers temporaires
    try { if (tmpJson) fs.unlinkSync(tmpJson); } catch {}
    try { if (tmpPptx) fs.unlinkSync(tmpPptx); } catch {}
  }
}
