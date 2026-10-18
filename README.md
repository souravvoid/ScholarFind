# ScholarFind — Global Scholarship Discovery & Deterministic Eligibility Matching Platform

ScholarFind is a production-grade, global scholarship discovery and academic credential matching web application built in accordance with the Google Stitch visual design system. It enables high-school, undergraduate, postgraduate, and doctoral students to complete an academic profile once, discover verified opportunities worldwide without commercial bias or paywalls, inspect explainable criteria rubrics, track application documents, and securely transition to official provider portals.

---

## 1. System Architecture

```
                       +-----------------------------------+
                       |    ScholarFind React 19 Client    |
                       |  (Vite + Tailwind v4 + Three.js)  |
                       +-----------------+-----------------+
                                         |
                +------------------------+------------------------+
                |                                                 |
                v                                                 v
+-------------------------------+               +----------------------------------+
|   Firebase Cloud Services     |               |    Python 3.12 FastAPI Backend   |
| - Firebase Auth (Google Sign) |               | - Deterministic Matching Engine  |
| - Firestore DB (ABAC Rules)   |               | - SQLAlchemy 2.0 ORM & Alembic   |
| - Student Profile & Tracker   |               | - 10-Source Ingestion Pipeline   |
+-------------------------------+               +----------------------------------+
```

### Visual & Component System
- **Visual Reference**: Google Stitch Design System (Tactile Academic Modernism, `#fbfbfa` canvas, `#0037b0` sapphire interactive accents, `#1a1a1e` ink typography).
- **Hero Visualization**: Three.js interactive 3D Geodesic Hub constellation with collegiate destination nodes and motion reduction support.
- **Semantic Badging**: Muted Emerald (`#ecfdf5` / `#047857`) for Likely Eligible; Amber (`#fffbeb` / `#b45309`) for Information Needed; Rose (`#fff1f2` / `#be123c`) for Ineligible.

---

## 2. Ingestion Pipeline: 10 Authoritative Sources

ScholarFind implements a modular ingestion architecture with bounded exponential backoff, robots.txt compliance, Pydantic schema validation, and idempotent deduplication:

| Source ID | Agency / Foundation | Origin Country | Verified Listings | Access Method |
|---|---|---|---|---|
| `src_csc_uk` | Commonwealth Scholarship Commission | United Kingdom | 342 | Official Government Open Data (`gov.uk`) |
| `src_daad_de` | DAAD German Academic Exchange Service | Germany | 215 | Official Public REST Service (`daad.de`) |
| `src_fulbright_us` | Fulbright Program / IIE | United States | 184 | Diplomatic Mission Registry (`fulbrightonline.org`) |
| `src_erasmus_eu` | Erasmus+ / EMJMD Secretariat (EACEA) | European Union | 198 | Open Data Portal & Consortium Catalogs |
| `src_chevening_uk` | Chevening Secretariat | United Kingdom | 128 | Official Registry Feed (`chevening.org`) |
| `src_mext_jp` | MEXT Japanese Government Registry | Japan | 98 | Diplomatic Mission Gazette (`studyinjapan.go.jp`) |
| `src_si_se` | Swedish Institute (SI) | Sweden | 76 | Government Portal (`si.se`) |
| `src_australia_awards` | Department of Foreign Affairs and Trade (DFAT) | Australia | 112 | OASIS Official Interface (`dfat.gov.au`) |
| `src_vanier_ca` | Vanier Canada CGS Secretariat | Canada | 156 | Tri-Agency Federal Registry (`vanier.gc.ca`) |
| `src_rotary_global` | The Rotary Foundation Peace Centers | Global | 65 | Official Grants Database (`rotary.org`) |

---

## 3. Deterministic Eligibility Matching Engine

Rather than using opaque machine-learning guesses or ungrounded percentages, ScholarFind evaluates candidates using deterministic Boolean logic:

1. **Academic Standardization**: Converts 4.0 US, 5.0 Nigerian/Singapore, UK Honours Classification (First, 2:1, 2:2), Percentage (0-100), ECTS, and German (1.0-4.0) scales to a normalized 0-100 benchmark.
2. **Citizenship & Bilateral Pacts**: Matches applicant passport origins against bilateral treaties and restricted lists.
3. **Degree Level Alignment**: Validates prerequisites (e.g. Bachelor's holders qualify for Master's programs).
4. **Disciplinary Taxonomy**: Evaluates primary fields, sub-disciplines, and faculty tags (STEM, Biomedical, Social Policy, etc.).
5. **Language Waivers**: Recognizes Medium of Instruction waivers from accredited WHED-listed institutions alongside IELTS/TOEFL.
6. **Work Experience**: Verifies professional and community leadership years against program minimums (e.g., 2,800 hours for Chevening, 3+ years for Rotary).

Outcomes:
- **Likely Eligible**: All mandatory rules satisfied; 0 missing fields.
- **Potential Match (More Info Needed)**: Criteria met, but specific inputs pending (e.g., English waiver verification or Bachelor's field alignment).
- **Does Not Meet Known Criterion**: At least one mandatory requirement fails (e.g., non-qualifying citizenship or GPA below threshold).

---

## 4. Security & Open-Redirect Defense

- **Official Redirection Defense**: External links display a modal confirming the user is leaving ScholarFind to an audited domain (`gov.uk`, `daad.de`, `stanford.edu`, `europa.eu`).
- **Zero Open-Redirects**: URL schemes are strictly verified against stored data records; arbitrary user query redirects are blocked.
- **Zero-Trust ABAC**: Firestore Security Rules isolate student profiles (`/users/{userId}/profile/data`) and personal saved items.

---

## 5. Local Setup & Testing

### Frontend (Node.js)
```bash
npm install
npm run dev
```

### Backend (Python 3.12+)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic sqlalchemy
uvicorn main:app --reload --port 8000
```

### Running Tests
```bash
# Python Backend tests
pytest backend/tests/test_backend.py -v

# Frontend Typescript compilation
npm run lint
```
