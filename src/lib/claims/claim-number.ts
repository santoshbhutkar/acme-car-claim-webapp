import { prisma } from "@/lib/db";

export async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;

  const latest = await prisma.claim.findFirst({
    where: { claimNumber: { startsWith: prefix } },
    orderBy: { claimNumber: "desc" },
    select: { claimNumber: true },
  });

  let next = 1;
  if (latest?.claimNumber) {
    const parts = latest.claimNumber.split("-");
    const seq = Number.parseInt(parts[2] ?? "0", 10);
    if (!Number.isNaN(seq)) {
      next = seq + 1;
    }
  }

  return `${prefix}${String(next).padStart(4, "0")}`;
}
