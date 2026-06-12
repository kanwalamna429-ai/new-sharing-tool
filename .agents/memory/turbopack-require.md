---
name: Turbopack require() pitfall
description: Dynamic require() of path-aliased modules silently breaks under Next.js 16 Turbopack ESM bundling.
---

Using `require("@/lib/supabase/client")` inside a function body causes the module to return undefined at runtime under Turbopack (Next.js 16). The try/catch around it then returns null, so every Supabase call is silently skipped.

**Why:** Turbopack is ESM-native. Dynamic CommonJS require() of ES modules is unreliable in this context.

**How to apply:** Always use static `import { createClient } from "@/lib/supabase/client"` at the top of the file. Wrap the call in try/catch at the call site if you need to handle missing env vars:
```ts
import { createClient } from "@/lib/supabase/client"
function getSupabase() {
  try { return createClient() } catch { return null }
}
```
