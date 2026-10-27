import { NextResponse } from "next/server";

export type ErrorCode =
  | "invalid_email"
  | "disposable_email"
  | "validation_error"
  | "rate_limited"
  | "not_found"
  | "forbidden_origin"
  | "server_error";

const NO_STORE = { "Cache-Control": "no-store" };

export function jsonError(
  status: number,
  code: ErrorCode,
  message: string,
  extra?: { fields?: Record<string, string[]>; retryAfterSeconds?: number },
) {
  const headers: Record<string, string> = { ...NO_STORE };
  if (extra?.retryAfterSeconds) headers["Retry-After"] = String(extra.retryAfterSeconds);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(extra?.fields ? { fields: extra.fields } : {}),
        ...(extra?.retryAfterSeconds ? { retry_after_seconds: extra.retryAfterSeconds } : {}),
      },
    },
    { status, headers },
  );
}

export function jsonOk<T extends object>(status: number, body: T) {
  return NextResponse.json({ ok: true, ...body }, { status, headers: NO_STORE });
}
