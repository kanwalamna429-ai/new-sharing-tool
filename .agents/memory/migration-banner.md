---
name: Migration banner pattern
description: How to detect and surface Supabase "table does not exist" errors to users.
---

When the Supabase migration hasn't been run, every DB call fails with PostgreSQL error code 42P01 ("relation does not exist"). Without detection the app silently falls back to empty state and users have no idea why nothing saves.

**Detection:** Check `error.message.toLowerCase().includes("does not exist")` or `error.code === "42P01"` in catch blocks.

**How to apply:**
- In client stores (url-store, campaigns-store): expose `dbError: string | null` from context, set it on Supabase errors.
- In API routes: include `detail: err.message` alongside the generic "Internal server error" in the 500 response body.
- In pages: read `dbError` or `response.detail` and render an amber banner pointing to `supabase/migrations/001_initial.sql`.
- Dashboard page already has `migrationNeeded` state using this pattern as the canonical example.
