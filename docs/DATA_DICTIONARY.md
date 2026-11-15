# Data Dictionary

Last audited: 2026-11-15. This index identifies authoritative schema sources; it deliberately
does not invent a normalized field list beyond fields verified in the source review.

| Data domain | Current source of truth | Observed shape / notes |
|---|---|---|
| Student profile | [`backend/students/models.py`](../backend/students/models.py), serializers, and migrations | GPA inputs are validated/normalized; fields remain subject to model definitions. The SPA also stores profile data locally. |
| Scholarship | [`backend/scholarships/models.py`](../backend/scholarships/models.py) and migrations | Destination, education level, and field values include text-based representations. |
| Saved scholarship | [`backend/saved/models.py`](../backend/saved/models.py) | User/scholarship uniqueness is enforced. |
| Application tracking | [`backend/tracking/models.py`](../backend/tracking/models.py) | User/scholarship uniqueness is enforced; tracker detail is also present in local browser state. |
| Matching records | [`backend/matching/models.py`](../backend/matching/models.py) | Includes manual-review and work-experience models; the related view/model ownership mapping has a verified defect. |
| Catalogue and sources in browser | [`src/data/scholarshipsData.ts`](../src/data/scholarshipsData.ts), [`src/data/sourcesData.ts`](../src/data/sourcesData.ts), and Firestore service | Static fallbacks and Firestore records are distinct inputs; do not treat mock presentation counts as database totals. |

For exact columns and constraints, inspect each model and its migration. Do not copy
production student data into fixtures. Any future demo data must be synthetic and clearly
labelled.
