import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDir } from "@/lib/uploads";

/** Serves uploaded venue photos from the data volume with long cache headers (filenames are content-addressed random ids). */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = path.basename((await params).name);
  if (!/^[a-f0-9]{16}(_t)?\.webp$/.test(name)) return new NextResponse("Not found", { status: 404 });
  const file = path.join(uploadDir(), name);
  if (!fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(fs.readFileSync(file), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
}
