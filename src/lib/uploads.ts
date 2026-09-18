// Venue photo storage: resized copies on local disk (the same volume as the SQLite file), served by /api/uploads.
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

export const MAX_PHOTOS_PER_VENUE = 8;
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function uploadDir(): string {
  const dir = process.env.PLAYVTH_UPLOAD_DIR || path.join(path.dirname(process.env.PLAYVTH_DB_PATH || path.join(process.cwd(), "data", "playvth.db")), "uploads");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export type SavedPhoto = { file: string; thumb: string; width: number; height: number };

/** Validates, resizes (max 1600px) and writes a large + thumbnail WebP. Throws a user-facing Error on bad input. */
export async function savePhoto(file: File): Promise<SavedPhoto> {
  if (!ALLOWED.has(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error(`${file.name}: only JPG, PNG, WebP or HEIC images are allowed.`);
  if (file.size > MAX_PHOTO_BYTES) throw new Error(`${file.name}: photos must be under 8 MB.`);
  const input = Buffer.from(await file.arrayBuffer());
  const id = randomBytes(8).toString("hex");
  const dir = uploadDir();
  const large = sharp(input, { failOn: "none" }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 });
  const meta = await large.toBuffer({ resolveWithObject: true });
  fs.writeFileSync(path.join(dir, `${id}.webp`), meta.data);
  const thumb = await sharp(meta.data).resize({ width: 640, height: 400, fit: "cover" }).webp({ quality: 78 }).toBuffer();
  fs.writeFileSync(path.join(dir, `${id}_t.webp`), thumb);
  return { file: `${id}.webp`, thumb: `${id}_t.webp`, width: meta.info.width, height: meta.info.height };
}

export function deletePhotoFiles(...names: string[]) {
  for (const n of names) { try { fs.unlinkSync(path.join(uploadDir(), path.basename(n))); } catch { /* already gone */ } }
}

export { photoUrl } from "./photo-url";
