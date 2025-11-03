## TypeScript Conversion Plan (20%)

### Goals
- Introduce TypeScript with a build step; keep runtime JS output compatible with current app.
- Convert meaningful modules (types included) to reach a solid conversion percentage.

### Tooling
- `tsconfig.json` at repo root (emits to existing JS folders)
- `npm run ts:build` to compile

### Targets (Phase 1)
1. `frontend/js/backend-api.js` → `frontend/ts/backend-api.ts`
2. `frontend/js/supabase-db.js` → `frontend/ts/supabase-db.ts`
3. Shared types: `frontend/ts/types.ts` (Session, Result, Progress, Stats)

Emitted JS goes to `frontend/js` to avoid changing HTML script tags.

### Targets (Phase 2)
- Gradually type `dashboard.js` and `practice.js` entry points using JSDoc/TS migration or split into typed helpers under `frontend/ts/`.

### Definition of Done
- Build passes with `tsc` (no `any` for core entities; avoid `// @ts-ignore`).
- Runtime behavior unchanged; pages load without console errors.
- Documented types used in at least the API and DB layers.


