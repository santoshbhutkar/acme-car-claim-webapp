import { NextRequest, NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, zodErrorResponse } from "@/lib/api";
import { canTransition, formatStatusLabel } from "@/lib/claims/status";
import { adjusterStatusSchema } from "@/lib/claims/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = adjusterStatusSchema.parse(await request.json());
    const nextStatus = body.status as ClaimStatus;

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) {
      return jsonError("Claim not found", 404);
    }

    if (!canTransition(claim.status, nextStatus)) {
      return jsonError(
        `Cannot move from ${formatStatusLabel(claim.status)} to ${formatStatusLabel(nextStatus)}`,
        409,
      );
    }

    if (nextStatus === ClaimStatus.DENIED && !body.note?.trim()) {
      return jsonError("A reason is required when denying a claim");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.claim.update({
        where: { id },
        data: {
          status: nextStatus,
          adjusterNote: body.note?.trim() || claim.adjusterNote,
        },
      });

      await tx.statusHistory.create({
        data: {
          claimId: id,
          fromStatus: claim.status,
          toStatus: nextStatus,
          note: body.note?.trim() || null,
        },
      });

      return result;
    });

    return NextResponse.json({
      id: updated.id,
      claimNumber: updated.claimNumber,
      status: updated.status,
      statusLabel: formatStatusLabel(updated.status),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    return jsonError("Failed to update claim status", 500);
  }
}
