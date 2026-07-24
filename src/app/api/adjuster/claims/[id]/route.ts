import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { formatStatusLabel, getAllowedTransitions } from "@/lib/claims/status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const claim = await prisma.claim.findUnique({
    where: { id },
    include: {
      policy: true,
      attachments: { orderBy: { uploadedAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!claim) {
    return jsonError("Claim not found", 404);
  }

  return NextResponse.json({
    id: claim.id,
    claimNumber: claim.claimNumber,
    status: claim.status,
    statusLabel: formatStatusLabel(claim.status),
    allowedTransitions: getAllowedTransitions(claim.status),
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
    policy: claim.policy,
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
