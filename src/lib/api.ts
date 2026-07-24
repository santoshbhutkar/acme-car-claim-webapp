import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  const message = error.issues.map((issue) => issue.message).join("; ");
  return jsonError(message || "Invalid request", 400);
}
