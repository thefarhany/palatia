import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import fs from "fs";
import multer from "multer";
import type express from "express";
import { diskStorage } from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_ROOT = path.resolve(__dirname, "../../uploads");

// MIME whitelist → extension. Anything else is rejected by the file filter.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Multer storage writing to uploads/<subdir> (uploads/menu, uploads/profile).
// Uses slugified name if provided in body or original filename, fallback to UUID.
export function makeStorage(subdir: string) {
  return diskStorage({
    destination(_req, _file, cb) {
      const dir = path.join(UPLOAD_ROOT, subdir);
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    filename(req, file, cb) {
      const ext = ALLOWED[file.mimetype] ?? "bin";
      const nameInBody = typeof req.body?.name === "string" ? req.body.name : "";
      const originalBaseName = path.parse(file.originalname).name;
      const base = nameInBody || originalBaseName;
      const slug = slugify(base);
      const filename = `${slug || crypto.randomUUID()}.${ext}`;
      cb(null, filename);
    },
  });
}

/** Hapus file lama dari folder uploads saat foto diubah atau menu dihapus. */
export function deleteUploadFile(imageUrl: string | null | undefined): void {
  if (!imageUrl || !imageUrl.startsWith("/uploads/")) return;
  const relativePath = imageUrl.replace(/^\/uploads\//, "");
  const fullPath = path.resolve(UPLOAD_ROOT, relativePath);
  if (!fullPath.startsWith(UPLOAD_ROOT)) return;

  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error(`[Uploads] Gagal menghapus file lama: ${fullPath}`, err);
    }
  });
}


export function isAllowedMime(mime: string): boolean {
  return mime in ALLOWED;
}

export function uploadUrl(subdir: string, filename: string): string {
  return `/uploads/${subdir}/${filename}`;
}

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export class UploadReject extends Error {}

// Multer uploader bound to a subdir (uploads/menu, uploads/profile).
export function makeUploader(subdir: string) {
  return multer({
    storage: makeStorage(subdir),
    limits: { fileSize: MAX_SIZE },
    fileFilter(_req, file, cb) {
      if (!isAllowedMime(file.mimetype)) return cb(new UploadReject());
      cb(null, true);
    },
  });
}

// Mounted after routers that accept uploads: multer errors and the filter
// surface as 400 with a clean message; anything else falls through.
export function uploadErrorHandler(err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5MB)" : "Upload failed" });
  }
  if (err instanceof UploadReject) {
    return res.status(400).json({ error: "Only jpg/png/webp allowed" });
  }
  next(err);
}