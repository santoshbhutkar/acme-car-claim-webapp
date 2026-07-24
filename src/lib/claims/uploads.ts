import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

export function isAllowedImage(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getUploadLimits() {
  return { maxFiles: MAX_FILES, maxFileBytes: MAX_FILE_BYTES };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export async function saveUploadedFiles(
  claimId: string,
  files: File[],
): Promise<{ filename: string; mimeType: string; path: string }[]> {
  if (files.length > MAX_FILES) {
    throw new Error(`You can upload at most ${MAX_FILES} files.`);
  }

  const claimDir = path.join(UPLOAD_ROOT, claimId);
  await mkdir(claimDir, { recursive: true });

  const saved: { filename: string; mimeType: string; path: string }[] = [];

  for (const file of files) {
    if (!isAllowedImage(file.type)) {
      throw new Error(
        `File type not allowed: ${file.type || "unknown"}. Use JPEG, PNG, WebP, or GIF.`,
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error(`File ${file.name} exceeds the 5MB limit.`);
    }

    const safeName = sanitizeFilename(file.name || "photo.jpg");
    const storedName = `${randomUUID()}-${safeName}`;
    const absolutePath = path.join(claimDir, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    saved.push({
      filename: safeName,
      mimeType: file.type,
      path: path.join(claimId, storedName),
    });
  }

  return saved;
}

export function resolveUploadPath(relativePath: string): string {
  const resolved = path.resolve(UPLOAD_ROOT, relativePath);
  if (!resolved.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid upload path");
  }
  return resolved;
}
