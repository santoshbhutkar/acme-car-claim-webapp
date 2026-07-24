import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { resolveUploadPath } from "@/lib/claims/uploads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  const adjuster = request.nextUrl.searchParams.get("adjuster") === "1";

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { claim: true },
  });

  if (!attachment) {
    return jsonError("Attachment not found", 404);
  }

  if (!adjuster) {
    if (!email || attachment.claim.contactEmail.toLowerCase() !== email) {
      return jsonError("Unauthorized", 403);
    }
  }

  try {
    const absolutePath = resolveUploadPath(attachment.path);
    const bytes = await readFile(absolutePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return jsonError("File missing on disk", 404);
  }
}
