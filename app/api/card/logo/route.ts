import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const logoPath = path.join(process.cwd(), "public", "brand", "czi-logo.jpeg");
    const buffer = await readFile(logoPath);
    const base64 = buffer.toString("base64");
    return NextResponse.json({ base64: `data:image/jpeg;base64,${base64}` });
  } catch {
    return NextResponse.json({ error: "Logo non trouvé" }, { status: 404 });
  }
}
