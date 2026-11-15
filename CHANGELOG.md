# Changelog

All notable changes to ScholarFind will be documented in this file.

## Unreleased

### Added
- 39 real India-focused scholarships from official sources (NSP, AICTE, UGC, Ministry of Education, and private foundations)
- Profile defaults changed to India citizenship / University of Delhi
- OfficialRedirectModal runtime https/host guard
- ScholarshipImage https-only src validation
- package-lock.json added to .gitignore

### Changed
- Frontend lint: resolved @testing-library/dom missing dependency
- Frontend lint: resolved @ts-ignore workarounds
- Dependency alignment: @testing-library/dom + esbuild for Vite 8
- README.md: updated with professional summary and project status

### Fixed
- Dead code removal: unused Firebase Auth surface (src/firebase.ts deleted, firebase dependency removed)
- Security hardening: OfficialRedirectModal.handleProceed https+host guard
- Playwright: 0 console errors across all 7 routes

## 2026-11-15

### Added
- Initial 48-record scholarship catalogue (9 original + 39 new Indian scholarships)
- Django 6 + DRF backend with PostgreSQL 16
- Token authentication (login/logout/register/me)
- Student profile, saved scholarships, application tracker
- Eligibility engine (deterministic TS + Python implementations)
- Playwright E2E test suite (10 tests)
- Frontend unit tests (51 tests) and component tests (11 tests)
- System design documentation (HLD, LLD, ER diagram, OS mapping, networking)
- Professor demo guide and viva questions
- README.md with technology stack and setup instructions

## 2026-11-14

### Added
- Repository initialization with React + Vite + Tailwind frontend
- Django + DRF backend scaffold
- Basic scholarship discovery and profile pages
