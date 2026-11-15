---
name: scholarfind
description: Project-specific engineering conventions for ScholarFind, derived from git history. Use when changing the React/Vite frontend, the Django REST backend, the scholarship catalogue ingestion, the eligibility engine, or the shared design system.
---

# ScholarFind Engineering

## Overview

ScholarFind is a scholarship-discovery product with two coexisting stacks:

- **Frontend:** React 19 + Vite + Tailwind v4 + react-router, Firebase Auth/Firestore for the
  existing client flows, and a shared `src/components/ui/` primitive layer driven by design
  tokens in `src/index.css`.
- **Backend:** Django 6 + DRF + PostgreSQL under `backend/`, migrated from FastAPI while
  preserving the old HTTP contracts (`/api/v1/...`), with a deterministic Python eligibility
  engine mirrored by a TypeScript engine in `src/utils/eligibilityEngine.ts`.

Git history shows a consistent working style: small scoped commits, conventional commit
messages, explicit honesty about data, server-owned authorization, and a written status ledger
in `docs/ai/WORK_STATUS.md`. This skill encodes those conventions so new work matches the repo.

## Patterns

### Pattern 1: Contract-first framework migration

**When to use:** Replacing or reimplementing an API layer (the FastAPI → Django/DRF migration,
commits `232cb73`, `7a19f7a`).

- Keep every existing URL, JSON field name, envelope, and status code. Add new behavior
  (database persistence, counters) without renaming the old contract.
- Implement compatibility endpoints alongside the new ones, e.g.
  `evaluate_compat` at `/api/v1/evaluate/` and the DB-aware
  `evaluate_eligibility` at `/api/v1/eligibility/` in `backend/accounts/views.py`.
- Give legacy unit-test imports a path to survive: `backend/pytest.ini` sets
  `pythonpath = . ..` so both Django apps and `backend.*` resolve.
- Document the migration state and task list in `backend/MIGRATION_REPORT.md`.

**Example:** `ScholarshipViewSet.list()` in `backend/scholarships/views.py` manually builds the
old paginated envelope (`page`, `page_size`, `total_count`, `results`) instead of dropping in
DRF's default pagination shape.

### Pattern 2: Server-controlled ownership and scoping

**When to use:** Any user-owned resource (`profiles`, `saved`, `tracking`, `matching`).

- Put `IsAuthenticated` on the viewset.
- Scope `get_queryset()` to `request.user`; guard DRF schema generation with
  `getattr(self, "swagger_fake_view", False)`.
- Assign ownership in `perform_create()` (`serializer.save(user=self.request.user)`), never from
  client input.
- Mark ownership and moderation fields `read_only_fields` in the serializer.
- Enforce uniqueness in `validate()` against the current user, excluding `self.instance` on update.

**Example:** `backend/saved/serializers.py` marks `("user", "saved_at", "updated_at")` read-only
and rejects duplicate saves; `backend/matching/serializers.py` marks `student`, `reviewed`,
`reviewed_at`, `reviewer`, `verified`, and `verification_date` read-only while
`perform_create()` supplies `student`.

### Pattern 3: Idempotent catalogue ingestion

**When to use:** Importing normalized records from the adapter pipeline into PostgreSQL.

- Route all writes through `backend/scholarships/services.py`, shared by the admin endpoint and
  the `populate_scholarships` management command.
- Use `update_or_create` keyed by a stable slug; disambiguate collisions by appending the source
  id (`f"{base_slug}-{slugify(record.source_id)}"`).
- Replace child collections deliberately (`eligibility_rules.all().delete()` then recreate) so
  repeated runs converge rather than duplicate.
- Aggregate `(created, updated)` counters and record an `IngestionJob`.
- Never invent missing source facts: if a deadline is absent, store ingestion time and append an
  explicit "deadline has not been published" note (`services.py`).

**Verification:** the command is expected to be re-runnable with `created=0 updated=N`.

### Pattern 4: Deterministic, explainable eligibility evaluation

**When to use:** Changing rules, scoring, or matching behavior.

- Normalize all grading scales to a 0–100 index in one place. Both engines must agree:
  `standardize_gpa` (Python `eligibility_service.py`) and `normalizeGpa`
  (`src/utils/eligibilityEngine.ts`).
- Return explicit criterion statuses (`MEETS` / `FAILS` / `MISSING` / `MANUAL_REVIEW`) with an
  explanation and source citation — never a bare boolean.
- Keep parity tests in `backend/tests/test_eligibility_service.py`; when changing a threshold,
  change both implementations in the same commit (see `fba7eb9`, UK 1st 95 → 85).

### Pattern 5: Design-system primitives and tokens only

**When to use:** Any UI change.

- Compose pages from `src/components/ui/` (`Button`, `Card`, `Badge`, `Chip`, `EmptyState`,
  `ErrorPanel`, `Skeleton`, `Icon`); do not restyle per page.
- Import icons only through `src/components/ui/Icon.tsx`; it centralizes lucide-react semantics
  and automatically applies `aria-hidden` to decorative icons.
- Use semantic tokens from `src/index.css` (`--color-ink-muted`, `--color-sapphire`,
  `--color-bad-text`, `--radius-control`, `--ease-arc`). Avoid raw hex values and retired colors.
- Respect the global reduced-motion contract already defined in `index.css`.

### Pattern 6: Honest data and safe fallbacks

**When to use:** Anything user-facing that shows counts, stats, provenance, or external links.

- Do not add fake testimonials, mock stats, or invented numbers. History explicitly removed
  "842 grants" / demo personas and rebuilt pages on real data (`afb0fe2`, `4afc6c3`, `4e1eedc`).
- Treat Firestore/API payloads as untrusted: validate shape before use. See
  `isValidScholarship()` / `isValidSource()` in `src/services/databaseService.ts`.
- Fall back to the verified static catalogue and surface *why* (`fromDatabase: false`,
  `error`), rather than silently pretending the data is live.
- External URLs always pass through `OfficialRedirectModal`; do not bypass the gate.

### Pattern 7: Step-wise delivery with a status ledger

**When to use:** Multi-file or multi-step work.

- Update `docs/ai/WORK_STATUS.md` with what changed, the commit hash, and the verification
  result (`docs(status): mark step N done` appears throughout history).
- Commit in small conventional units: `type(scope): imperative summary`, e.g.
  `feat(explore): ...`, `fix(security): ...`, `docs(status): ...`.
- Cite quality gates in commit bodies when they ran (history consistently records lint, unit,
  build, and e2e results).

### Pattern 8: Security defaults are non-negotiable

**When to use:** Backend settings, auth, serializers, or any endpoint.

- `DEBUG`, `SECRET_KEY`, and `ALLOWED_HOSTS` come from the environment; production refuses to
  boot with `DEBUG=True` or no secret (`backend/config/settings.py`).
- Keep CSRF enabled for state-changing session endpoints; use the
  `/api/auth/csrf/` cookie endpoint for browser clients. Stateless compute endpoints may be
  exempt with an explicit comment.
- Compare OAuth `state` with `constant_time_compare` and require it to be present.
- Throttle expensive endpoints via `backend/config/throttles.py` and
  `REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']`.
- The public catalogue is read-only through the API; writes go through staff-only ingestion or
  Django admin.

## Best Practices

1. Read `docs/PROJECT_CONTEXT.md`, `docs/ai/WORK_STATUS.md`, and `AGENTS.md` before touching code.
2. Keep changes inside the relevant layer and the smallest diff that preserves behavior.
3. Put all Firestore access in `src/services/databaseService.ts` / `src/context/AuthContext.tsx`,
   and all backend persistence in `backend/scholarships/services.py`.
4. Preserve existing test suites; add coverage rather than weakening or deleting assertions.
5. Verify with the repo's definition of done: `npm run lint`, relevant unit suites,
   `npm run build`, and `npx playwright test`.
6. Prefer explicit failure/fallback signals over silent guesses when external data is missing.
7. Keep the two eligibility engines in sync, including thresholds and edge cases.

## Common Mistakes

1. **Writing catalogue data from the client** — `scholarships`, `scholarship_sources`, and
   `ingestion_logs` must stay read-only from the React app. Avoid it by using the staff ingestion
   path / admin.
2. **Trusting `read_only_fields` alone for ownership** — also set the owner in
   `perform_create()` and scope the queryset.
3. **Breaking API contracts during a rewrite** — renaming fields or dropping envelope keys breaks
   the frontend. Keep a compatibility endpoint and test it.
4. **Fabricating data** — mock stats, fake "last audited" labels, or invented deadlines are
   recurring defects in this repo's history. Use real values or state the gap.
5. **Bypassing the external-link gate** — never open a data-provided URL without
   `OfficialRedirectModal`.
6. **Raw hex / page-specific styles** — use design tokens and `ui/` primitives.
7. **Committing generated artifacts** — `__pycache__/`, `*.pyc`, `.env*`, and `.opencode/` are
   ignored; keep them out of git.
8. **Weakening tests or skipping the status ledger** — both are explicit repo rules.

## Examples

### Good example — user-owned, idempotent, server-assigned

```python
# backend/saved/views.py
class SavedScholarshipViewSet(viewsets.ModelViewSet):
    serializer_class = SavedScholarshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return SavedScholarship.objects.none()
        return SavedScholarship.objects.filter(user=self.request.user).select_related(
            "scholarship"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

```python
# backend/scholarships/services.py
scholarship, created = Scholarship.objects.update_or_create(
    slug=slug, defaults=defaults
)
```

### Anti-pattern — client-owned catalogue write and unvalidated data

```ts
// Do not do this: the client must not seed/write the public catalogue.
await setDoc(doc(db, 'scholarships', id), scholarshipData);
```

```ts
// Do not do this either: a cast is not validation of untrusted Firestore data.
const item = docSnap.data() as Scholarship;
list.push(item);
```

Use the staff-only ingestion endpoint or Django admin for writes, and validate the incoming shape
(`isValidScholarship`) before using it.

### Good example — design-system component

```tsx
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

<Button variant="primary" onClick={onExplore}>
  Explore scholarships
  <Icon name="arrowRight" size={16} />
</Button>
```

### Anti-pattern — ad-hoc icon import and raw hex

```tsx
import { ArrowRight } from 'lucide-react';

<span style={{ color: '#6b7280' }}><ArrowRight /></span>
```

Import icons through `Icon.tsx` and use semantic tokens such as `text-ink-muted`.

## Verification Commands

| Task | Command |
|---|---|
| Frontend type check | `npm run lint` |
| Frontend unit tests | `npm run test:frontend` |
| Component tests | `npm run test:components` |
| Backend legacy tests | `npm run test:backend` |
| Django/pytest suite | `cd backend && python -m pytest -q` |
| Production build | `npm run build` |
| E2E | `npx playwright test` |
| Django health | `cd backend && python manage.py check` |
| Migration drift | `cd backend && python manage.py makemigrations --check --dry-run` |
