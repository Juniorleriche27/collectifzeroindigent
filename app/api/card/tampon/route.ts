import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "brand", "tampon-czi.jpeg");
    const buffer = await readFile(filePath);
    const base64 = buffer.toString("base64");
    return NextResponse.json({ base64: `data:image/jpeg;base64,${base64}` });
  } catch {
    return NextResponse.json({ error: "Tampon non trouvé" }, { status: 404 });
  }
}
