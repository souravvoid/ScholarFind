# Project Overview

Last audited: 2026-11-15.

## Purpose

ScholarFind is a scholarship discovery and eligibility-support application. It helps students
find opportunities, review criteria and source links, save items, and track application work.
The intended audience includes Indian students as well as users searching international
opportunities; current catalogue coverage must not be represented as comprehensive.

## Scope and non-goals

ScholarFind is an independent discovery tool. It is not a government or provider portal, does
not submit applications, does not award funds, and does not make official eligibility
decisions. Users must verify requirements and apply through the relevant provider.

## What exists today

- React, TypeScript, Vite client with routed discovery, detail, profile, tracker, sources, and
  authentication pages.
- Client catalogue/source reads through the Django API, with a bundled 48-record offline
  fallback when the API is unreachable.
- Django REST Framework backend with PostgreSQL, migrations, catalogue, account, saved,
  tracking, matching, and ingestion APIs.
- TypeScript and Python eligibility logic, plus frontend, backend, and browser tests.

Catalogue, source, and auth data now come from the Django API. Profile, saved, and tracker
state in the client is still browser-local rather than written through the authenticated APIs,
so it does not sync across devices. See [architecture](SYSTEM_ARCHITECTURE.md) and
[status](PROJECT_STATUS.md).

## Current demonstration boundary

A local UI demonstration is feasible. A demonstration of persisted backend workflows depends
on a reachable, migrated PostgreSQL database and valid backend configuration. Google OAuth
also requires provider configuration. Use clearly synthetic student personas and do not
present synthetic scholarship records as real opportunities; see [demo guide](DEMO_GUIDE.md).

## License

No project license was established by this audit. Do not assume the repository or its
scholarship data is licensed for redistribution.
