import { ClaimStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  SUBMITTED: [ClaimStatus.UNDER_REVIEW],
  UNDER_REVIEW: [
    ClaimStatus.NEEDS_INFO,
    ClaimStatus.APPROVED,
    ClaimStatus.DENIED,
  ],
  NEEDS_INFO: [ClaimStatus.UNDER_REVIEW],
  APPROVED: [],
  DENIED: [],
};

export function canTransition(
  from: ClaimStatus,
  to: ClaimStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: ClaimStatus): ClaimStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function isTerminalStatus(status: ClaimStatus): boolean {
  return status === ClaimStatus.APPROVED || status === ClaimStatus.DENIED;
}

export function formatStatusLabel(status: ClaimStatus): string {
  switch (status) {
    case ClaimStatus.SUBMITTED:
      return "Submitted";
    case ClaimStatus.UNDER_REVIEW:
      return "Under Review";
    case ClaimStatus.NEEDS_INFO:
      return "Needs Info";
    case ClaimStatus.APPROVED:
      return "Approved";
    case ClaimStatus.DENIED:
      return "Denied";
    default:
      return status;
  }
}
