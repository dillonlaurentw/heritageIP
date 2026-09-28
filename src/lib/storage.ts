import "server-only";
import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const uploadsEnabled = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.NODE_ENV !== "production";

/**
 * Store an uploaded image and return its public URL. Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set; in local dev, falls back to /public/uploads.
 */
export async function storeImage(file: File, folder: string) {
  const ext = TYPES[file.type];
  if (!ext) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > MAX_BYTES) throw new Error("Keep images under 4MB.");
  const name = `${folder}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Uploads aren't configured.");
  const dest = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
