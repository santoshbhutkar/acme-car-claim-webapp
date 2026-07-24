import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { formatStatusLabel } from "@/lib/claims/status";

type RouteContext = {
  params: Promise<{ claimNumber: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { claimNumber } = await context.params;
  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return jsonError("Email is required to look up a claim");
  }

  const claim = await prisma.claim.findUnique({
    where: { claimNumber: claimNumber.toUpperCase() },
    include: {
      policy: true,
      attachments: { orderBy: { uploadedAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!claim || claim.contactEmail.toLowerCase() !== email) {
    return jsonError("Claim not found for that number and email", 404);
  }

  return NextResponse.json({
    claimNumber: claim.claimNumber,
    status: claim.status,
    statusLabel: formatStatusLabel(claim.status),
    incidentType: claim.incidentType,
    incidentDate: claim.incidentDate,
    location: claim.location,
    description: claim.description,
    injuries: claim.injuries,
    policeReport: claim.policeReport,
    contactName: claim.contactName,
    contactEmail: claim.contactEmail,
    contactPhone: claim.contactPhone,
    plateEntered: claim.plateEntered,
    policyVerified: claim.policyVerified,
    adjusterNote: claim.adjusterNote,
    policy: claim.policy
      ? {
          policyNumber: claim.policy.policyNumber,
          make: claim.policy.make,
          model: claim.policy.model,
          year: claim.policy.year,
          plate: claim.policy.plate,
        }
      : null,
    attachments: claim.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      uploadedAt: a.uploadedAt,
    })),
    timeline: claim.statusHistory.map((h) => ({
      id: h.id,
      fromStatus: h.fromStatus,
      toStatus: h.toStatus,
      note: h.note,
      createdAt: h.createdAt,
      label: formatStatusLabel(h.toStatus),
    })),
  });
}
