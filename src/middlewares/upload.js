import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 10);

export const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    const err = new Error("Only PNG, JPEG or WEBP images are allowed");
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
});
