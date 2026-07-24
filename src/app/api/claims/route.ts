import { NextRequest, NextResponse } from "next/server";
import { ClaimStatus, IncidentType } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, zodErrorResponse } from "@/lib/api";
import { generateClaimNumber } from "@/lib/claims/claim-number";
import { createClaimSchema } from "@/lib/claims/validation";
import { getUploadLimits, saveUploadedFiles } from "@/lib/claims/uploads";

function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (typeof value !== "string") {
    return false;
  }
  return value === "true" || value === "on" || value === "1";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let raw: Record<string, unknown>;
    let files: File[] = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      raw = {
        incidentType: form.get("incidentType"),
        incidentDate: form.get("incidentDate"),
        location: form.get("location"),
        description: form.get("description"),
        injuries: parseBoolean(form.get("injuries")),
        policeReport: parseBoolean(form.get("policeReport")),
        contactName: form.get("contactName"),
        contactEmail: form.get("contactEmail"),
        contactPhone: form.get("contactPhone"),
        plate: form.get("plate"),
        policyNumber: form.get("policyNumber") || undefined,
      };
      files = form
        .getAll("photos")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    } else {
      raw = await request.json();
    }

    const data = createClaimSchema.parse(raw);
    const incidentDate = new Date(data.incidentDate);
    if (Number.isNaN(incidentDate.getTime())) {
      return jsonError("Invalid incident date");
    }

    const { maxFiles } = getUploadLimits();
    if (files.length > maxFiles) {
      return jsonError(`You can upload at most ${maxFiles} photos`);
    }

    const plate = data.plate.toUpperCase();
    const policy = data.policyNumber
      ? await prisma.policy.findFirst({
          where: {
            OR: [
              { plate: { equals: plate } },
              { policyNumber: { equals: data.policyNumber } },
            ],
          },
        })
      : await prisma.policy.findFirst({
          where: { plate: { equals: plate } },
        });

    const claimNumber = await generateClaimNumber();

    const claim = await prisma.claim.create({
      data: {
        claimNumber,
        status: ClaimStatus.SUBMITTED,
        incidentType: data.incidentType as IncidentType,
        incidentDate,
        location: data.location,
        description: data.description,
        injuries: data.injuries,
        policeReport: data.policeReport,
        contactName: data.contactName,
        contactEmail: data.contactEmail.toLowerCase(),
        contactPhone: data.contactPhone,
        plateEntered: plate,
        policyId: policy?.id,
        policyVerified: Boolean(policy),
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: ClaimStatus.SUBMITTED,
            note: "Claim filed via FNOL wizard",
          },
        },
      },
    });

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

    return NextResponse.json(
      {
        id: claim.id,
        claimNumber: claim.claimNumber,
        status: claim.status,
        policyVerified: claim.policyVerified,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return zodErrorResponse(error);
    }
    if (error instanceof Error) {
      return jsonError(error.message, 400);
    }
    return jsonError("Failed to create claim", 500);
  }
}
