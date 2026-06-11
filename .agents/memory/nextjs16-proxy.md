---
name: Next.js 16 proxy convention
description: middleware.ts was renamed to proxy.ts in Next.js 16; the export function name changed too
---

In Next.js 16 (this project uses 16.2.7), the route interception file changed:

- File name: `middleware.ts` → `proxy.ts`
- Exported function: `export async function middleware(...)` → `export async function proxy(...)`
- The `config` export with `matcher` stays the same

**Why:** Next.js 16 renamed the concept from "middleware" to "proxy" (see https://nextjs.org/docs/messages/middleware-to-proxy).

**How to apply:** Any new auth guard, rate limiter, or request interceptor must live in `frontend/proxy.ts` and export `proxy` as the function name. Having both `middleware.ts` and `proxy.ts` simultaneously throws a fatal startup error.
