import { NextRequest, NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { saveUploadedFiles } from "@/lib/claims/uploads";

type RouteContext = {
  params: Promise<{ claimNumber: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { claimNumber } = await context.params;
    const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return jsonError("Email is required");
    }

    const claim = await prisma.claim.findUnique({
      where: { claimNumber: claimNumber.toUpperCase() },
    });

    if (!claim || claim.contactEmail.toLowerCase() !== email) {
      return jsonError("Claim not found for that number and email", 404);
    }

    if (claim.status !== ClaimStatus.NEEDS_INFO) {
      return jsonError(
        "Additional evidence can only be added when the claim needs more info",
        409,
      );
    }

    const form = await request.formData();
    const files = form
      .getAll("photos")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const note = String(form.get("note") || "").trim();

    if (files.length === 0 && !note) {
      return jsonError("Provide photos or a note");
    }

    if (files.length > 0) {
      const saved = await saveUploadedFiles(claim.id, files);
      await prisma.attachment.createMany({
        data: saved.map((file) => ({
          claimId: claim.id,
          filename: file.filename,
          mimeType: file.mimeType,
          path: file.path,
        })),
      });
    }

    if (note) {
      await prisma.claim.update({
        where: { id: claim.id },
        data: {
          adjusterNote: claim.adjusterNote
            ? `${claim.adjusterNote}\n\nClaimant note: ${note}`
            : `Claimant note: ${note}`,
        },
      });
    }

    return NextResponse.json({ ok: true, added: files.length });
  } catch (error) {
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }
    return jsonError("Failed to add attachments", 500);
  }
}
