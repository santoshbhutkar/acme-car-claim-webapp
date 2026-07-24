import { PrismaClient, ClaimStatus, IncidentType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.statusHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.policy.deleteMany();

  const policies = await Promise.all([
    prisma.policy.create({
      data: {
        policyNumber: "POL-1001",
        plate: "ABC-1234",
        vin: "1HGBH41JXMN109186",
        make: "Honda",
        model: "Civic",
        year: 2022,
        holderName: "Jordan Lee",
        holderEmail: "jordan.lee@email.com",
      },
    }),
    prisma.policy.create({
      data: {
        policyNumber: "POL-1002",
        plate: "XYZ-9876",
        vin: "5YJSA1E26MF123456",
        make: "Tesla",
        model: "Model 3",
        year: 2021,
        holderName: "Sam Rivera",
        holderEmail: "sam.rivera@email.com",
      },
    }),
    prisma.policy.create({
      data: {
        policyNumber: "POL-1003",
        plate: "DEF-4567",
        vin: "WBA8E9G50JNU12345",
        make: "BMW",
        model: "330i",
        year: 2020,
        holderName: "Alex Chen",
        holderEmail: "alex.chen@email.com",
      },
    }),
    prisma.policy.create({
      data: {
        policyNumber: "POL-1004",
        plate: "GHI-5555",
        vin: "JM1BL1V73C1234567",
        make: "Mazda",
        model: "CX-5",
        year: 2023,
        holderName: "Casey Morgan",
        holderEmail: "casey.morgan@email.com",
      },
    }),
  ]);

  const sample = await prisma.claim.create({
    data: {
      claimNumber: "CLM-2026-0001",
      status: ClaimStatus.SUBMITTED,
      incidentType: IncidentType.COLLISION,
      incidentDate: new Date("2026-07-10T14:30:00Z"),
      location: "Market St & 5th Ave, San Francisco, CA",
      description:
        "Rear-ended at a stoplight. Visible bumper and trunk damage. No airbag deployment.",
      injuries: false,
      policeReport: true,
      contactName: "Jordan Lee",
      contactEmail: "jordan.lee@email.com",
      contactPhone: "+1-415-555-0101",
      plateEntered: "ABC-1234",
      policyId: policies[0].id,
      policyVerified: true,
    },
  });

  await prisma.statusHistory.create({
    data: {
      claimId: sample.id,
      fromStatus: null,
      toStatus: ClaimStatus.SUBMITTED,
      note: "Claim filed via FNOL wizard",
    },
  });

  console.log("Seeded 4 policies and 1 sample claim (CLM-2026-0001).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
