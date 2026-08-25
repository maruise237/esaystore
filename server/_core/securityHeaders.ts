import type { NextFunction, Request, Response } from "express";

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), geolocation=(), microphone=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": "base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
} as const;

export function applySecurityHeaders(res: Pick<Response, "setHeader">) {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, value);
  }
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  applySecurityHeaders(res);
  next();
}
