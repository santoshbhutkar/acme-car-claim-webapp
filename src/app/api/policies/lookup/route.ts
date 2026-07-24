import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/api";

export async function GET(request: NextRequest) {
  const plate = request.nextUrl.searchParams.get("plate")?.trim();
  const policyNumber = request.nextUrl.searchParams
    .get("policyNumber")
    ?.trim();

  if (!plate && !policyNumber) {
    return jsonError("Provide plate or policyNumber");
  }

  const policy = plate
    ? await prisma.policy.findFirst({
        where: { plate: { equals: plate.toUpperCase() } },
      })
    : await prisma.policy.findFirst({
        where: { policyNumber: { equals: policyNumber! } },
      });

  if (!policy) {
    return jsonError("No matching policy found", 404);
  }

  return NextResponse.json({
    policyNumber: policy.policyNumber,
    plate: policy.plate,
    vin: policy.vin,
    make: policy.make,
    model: policy.model,
    year: policy.year,
    holderName: policy.holderName,
    holderEmail: policy.holderEmail,
  });
}
