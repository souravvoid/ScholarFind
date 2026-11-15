# ScholarFind — Global Scholarship Discovery & Deterministic Eligibility Matching Platform

ScholarFind is a production-grade, global scholarship discovery and academic credential matching web application built on a custom design system documented in `docs/DESIGN_SYSTEM.md`. It enables high-school, undergraduate, postgraduate, and doctoral students to complete an academic profile once, discover verified opportunities worldwide without commercial bias or paywalls, inspect explainable criteria rubrics, track application documents, and securely transition to official provider portals.

---

## 1. System Architecture

```
                       +-----------------------------------+
                       |    ScholarFind React 19 Client    |
                       |  (Vite + Tailwind + lucide-react) |
                       +-----------------+-----------------+
                                         |
                +------------------------+------------------------+
                |                                                 |
                v                                                 v
+-------------------------------+               +----------------------------------+
|   Firebase Cloud Services     |               |    Python 3.10+ Eligibility Engine|
| - Firebase Auth (Google Sign) |               | - Deterministic Matching Rules   |
| - Firestore DB (ABAC Rules)   |               | - Normalized 0-100 Benchmark     |
| - Student Profile & Dossier   |               | - UK Honours / German Equivalence|
| - Saved Items & Tracker Sync  |               | - Citizenship & Bilateral Pacts  |
+-------------------------------+               +----------------------------------+
```

### Visual & Component System
- **Visual Reference**: Custom design system (`docs/DESIGN_SYSTEM.md`) — paper/sapphire palette, 3 type roles, 4px scale, lucide-react icons.
- **Semantic Badging** (design system tokens):
  - `Likely eligible`: `--color-ok-text` / `--color-ok-surface` / `--color-ok-border`
  - `More information needed`: `--color-warn-text` / `--color-warn-surface` / `--color-warn-border`
  - `Does not meet criterion`: `--color-bad-text` / `--color-bad-surface` / `--color-bad-border`
  - `Needs manual review`: Indigo accent (`--color-royal`)

---

## 2. Ingestion Pipeline: 10 Authoritative Sources

ScholarFind implements a modular ingestion architecture with bounded exponential backoff, robots.txt compliance, Pydantic schema validation, and idempotent deduplication:

| Source ID | Agency / Foundation | Origin Country | Access Method & License |
|---|---|---|---|
| `src_csc_uk` | Commonwealth Scholarship Commission | United Kingdom | Open Government Licence v3.0 (`gov.uk` Open Data) |
| `src_daad_de` | DAAD German Academic Exchange Service | Germany | Official Public Exchange Catalogue (`daad.de`) |
| `src_fulbright_us` | Fulbright Program / IIE | United States | Diplomatic Mission Registry (`fulbrightonline.org`) |
| `src_erasmus_eu` | Erasmus+ / EMJMD Secretariat (EACEA) | European Union | Open Data Portal & Consortium Catalogs |
| `src_chevening_uk` | Chevening Secretariat | United Kingdom | Official Registry Feed (`chevening.org`) |
| `src_mext_jp` | MEXT Japanese Government Registry | Japan | Diplomatic Mission Gazette (`studyinjapan.go.jp`) |
| `src_si_se` | Swedish Institute (SI) | Sweden | Government Portal (`si.se`) |
| `src_australia_awards` | Department of Foreign Affairs and Trade (DFAT) | Australia | OASIS Official Interface (`dfat.gov.au`) |
| `src_vanier_ca` | Vanier Canada CGS Secretariat | Canada | Tri-Agency Federal Registry (`vanier.gc.ca`) |
| `src_rotary_global` | The Rotary Foundation Peace Centers | Global | Official Grants Database (`rotary.org`) |

### Ingestion Stages
1. **Access Policy Verification**: Verifies source legal license terms, provenance URL, and rate limit compliance.
2. **Backoff Fetch**: Resilient exponential backoff with retry for official feeds.
3. **Parse**: Deserializes into typed `RawScholarshipRecord` structures with SHA-256 payload checksums.
4. **Normalize**: Harmonizes study levels, USD equivalent values, deadlines, and domain provenance.
5. **Validate**: Schema constraints enforcing HTTPS URLs, non-empty criteria, and destination countries.
6. **Idempotent Storage**: Prevents duplicate insertions on repeated adapter runs (`IngestionStorageRepository`).
7. **Audit Logging**: Emits runtime metrics (`records_fetched`, `records_parsed`, `records_stored_new`, `duplicates_prevented`, `elapsed_ms`).

---

## 3. Deterministic Eligibility Matching Engine

Rather than relying on opaque probabilistic guesses or hallucinated percentages, ScholarFind evaluates student profiles using deterministic rule execution:

1. **Academic Standardization**: Converts 4.0 US, 5.0 Nigerian/Singapore, UK Honours Classification (First Class, 2:1, 2:2, 3rd), Percentage (0-100), ECTS, and German (1.0-4.0) scales to a normalized 0-100 benchmark.
2. **Citizenship & Bilateral Pacts**: Matches applicant passport origins against bilateral treaties and restricted lists.
3. **Degree Level Alignment**: Validates prerequisites (e.g., Bachelor's holders qualify for Master's programs).
4. **Disciplinary Taxonomy**: Evaluates primary fields, sub-disciplines, and faculty tags (STEM, Biomedical, Social Policy, etc.).
5. **Language Waivers**: Recognizes Medium of Instruction (MOI) waivers from accredited WHED-listed institutions alongside IELTS/TOEFL/Duolingo scores.
6. **Work Experience**: Verifies professional and community leadership years against program minimums (e.g., 2 years for Chevening, 3+ years for Rotary).
7. **Human / Committee Appraisal**: Discretionary criteria (supervisor endorsements, nominating agency quotas, research proposals) are transparently routed to `Needs manual review`.

### 4 Deterministic Outcomes
- **`Likely eligible`**: All mandatory criteria are met with no blocking profile gaps.
- **`More information needed`**: Key prerequisites cannot be verified due to missing profile entries (e.g., GPA or language score).
- **`Does not meet criterion`**: At least one mandatory requirement is strictly violated (e.g., ineligible citizenship or GPA below threshold).
- **`Needs manual review`**: Core prerequisites are satisfied, but qualitative or institutional committee review is required.

---

## 4. Security & External Redirection Defense

- **Official Redirection Defense**: External links display a modal confirming the user is leaving ScholarFind to an audited domain (`gov.uk`, `daad.de`, `cam.ac.uk`, `europa.eu`).
- **Zero Open-Redirects**: URL schemes are strictly verified against stored data records; arbitrary query parameter redirects are blocked.
- **Zero-Trust ABAC**: Firestore Security Rules isolate student profiles (`/users/{userId}/profile/data`) and personal saved items (`/users/{userId}/saved/{id}`).
- **Open Government Data**: All listings credit official statutory origins with live timestamps and canonical links.

---

## 6. Recent Honesty Fixes

### M2 Engine Parity: UK 1st Class Threshold
Aligned the TypeScript eligibility engine (`src/utils/eligibilityEngine.ts`) UK 1st class threshold from `95` to `85`, matching the Python backend (`backend/eligibility.py`) canonical value. Both engines now use `85` as the threshold for UK First Class Honours equivalence.

---

## 5. Local Setup & Testing

### Running the Application

```bash
# 1. Install dependencies from the checked-in lockfile
bun install --frozen-lockfile

# 2. Run the React + Vite frontend
npm run dev

# 3. Compile check
npm run build
npm run lint
```

### Running the Complete Test Suite

```bash
# Install backend test dependencies once:
python3 -m pip install -r backend/requirements.txt

# Run frontend unit, component, and Python backend test suites:
npm test

# Run frontend unit tests:
npm run test:frontend

# Run frontend component tests:
npm run test:components

# Run Python backend tests:
npm run test:backend

# Run Chromium browser smoke tests:
npm run test:e2e
```

`npm test` runs every unit/component/backend group even when an earlier group fails, then
returns a failing exit status if any group failed. GitHub Actions runs the frontend and
backend checks separately and also gates on the Playwright smoke tests, type-check, and
production build for pushes and pull requests.
