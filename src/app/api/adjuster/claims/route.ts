import { NextResponse } from "next/server";
import { ClaimStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatStatusLabel } from "@/lib/claims/status";

export async function GET() {
  const claims = await prisma.claim.findMany({
    where: {
      status: {
        in: [
          ClaimStatus.SUBMITTED,
          ClaimStatus.UNDER_REVIEW,
          ClaimStatus.NEEDS_INFO,
        ],
      },
    },
    include: {
      policy: true,
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    claims: claims.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      statusLabel: formatStatusLabel(claim.status),
      incidentType: claim.incidentType,
      incidentDate: claim.incidentDate,
      location: claim.location,
      contactName: claim.contactName,
      contactEmail: claim.contactEmail,
      plateEntered: claim.plateEntered,
      policyVerified: claim.policyVerified,
      attachmentCount: claim.attachments.length,
      createdAt: claim.createdAt,
      vehicle: claim.policy
        ? `${claim.policy.year} ${claim.policy.make} ${claim.policy.model}`
        : claim.plateEntered,
    })),
  });
}
