import type { NextFunction, Request, Response } from "express";

export const NEON_AUTH_ORIGIN = "https://ep-blue-truth-ajqoem9y.neonauth.c-3.us-east-2.aws.neon.tech";

export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), geolocation=(), microphone=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Content-Security-Policy": `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ${NEON_AUTH_ORIGIN}; manifest-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
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
