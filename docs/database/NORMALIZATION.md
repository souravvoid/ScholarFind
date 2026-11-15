# Normalization

Entities are separated by domain: users/profiles, scholarships/catalogue, matching, saved, tracking.
1NF: repeating groups avoided by child tables for rules/documents; some list fields remain comma-separated text (documented denormalization).
2NF/3NF: non-key attributes depend on PK; no transitive dependencies beyond user/profile split.
BCNF not required for current relations. Functional dependencies: user->profile fields; scholarship->provider/source; rule->scholarship. Denormalization rationale: simple read-heavy catalogue filters and compatibility with TS frontend.