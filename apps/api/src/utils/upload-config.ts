import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import { diskStorage } from "multer";

export const UPLOAD_DIR = path.join(__dirname, "..", "..", "..", "uploads");

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function imageUploadOptions() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  return {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (_req, file, callback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        callback(null, `${crypto.randomUUID()}${ext}`);
      }
    }),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (_req: unknown, file: { mimetype: string }, callback: (error: Error | null, accept: boolean) => void) => {
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException("Only PNG, JPEG, or WEBP images are allowed"), false);
        return;
      }
      callback(null, true);
    }
  };
}
