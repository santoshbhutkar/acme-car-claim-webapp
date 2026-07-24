import { z } from "zod";

export const incidentTypeSchema = z.enum([
  "COLLISION",
  "THEFT",
  "GLASS",
  "WEATHER",
  "VANDALISM",
  "OTHER",
]);

export const createClaimSchema = z.object({
  incidentType: incidentTypeSchema,
  incidentDate: z.string().min(1, "Incident date is required"),
  location: z.string().trim().min(3).max(300),
  description: z.string().trim().min(10).max(2000),
  injuries: z.boolean(),
  policeReport: z.boolean(),
  contactName: z.string().trim().min(2).max(120),
  contactEmail: z.string().trim().email().max(200),
  contactPhone: z.string().trim().min(7).max(40),
  plate: z.string().trim().min(2).max(20),
  policyNumber: z.string().trim().max(40).optional(),
});

export const trackClaimSchema = z.object({
  claimNumber: z.string().trim().min(5).max(40),
  email: z.string().trim().email(),
});

export const adjusterStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "NEEDS_INFO", "APPROVED", "DENIED"]),
  note: z.string().trim().max(1000).optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
