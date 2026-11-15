# Query Analysis — ScholarFind

Representative ORM queries and their SQL equivalents.

## Catalogue list
```python
Scholarship.objects.filter(is_active=True).order_by("-application_deadline")[:50]
```
```sql
SELECT ... FROM scholarships_scholarship
WHERE is_active = TRUE
ORDER BY application_deadline DESC NULLS LAST
LIMIT 50;
```

## Detail by slug
```python
Scholarship.objects.get(slug=slug)
```
```sql
SELECT ... FROM scholarships_scholarship WHERE slug = %s;
```
(uses unique index on slug)

## Rules for a scholarship
```python
scholarship.eligibility_rules.all()
```
```sql
SELECT ... FROM scholarships_scholarshipeligibilityrule
WHERE scholarship_id = %s;
```

## Saved list (auth)
```python
SavedScholarship.objects.filter(user=request.user).select_related("scholarship")
```
```sql
SELECT ... FROM saved_savedscholarship s
JOIN scholarships_scholarship sch ON sch.id = s.scholarship_id
WHERE s.user_id = %s;
```

## Eligibility evaluation
Reads `Scholarship` + `ScholarshipEligibilityRule` rows; evaluation itself is
pure Python in `eligibility_service.py` (no DB writes).

## Indexing recommendations (not yet applied)
- Composite index on `(is_active, application_deadline)` for the default list sort.
- GIN/trigram index on `title` for search (currently plain btree).
- M2M tables if denormalized lists are split.
- No changes applied in this PR.
