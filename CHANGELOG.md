# Changelog

All notable changes to this project are documented in this file.

## v1.0 — 2026-02-25

First production release. Deployed for field testing with IHE partners.

### Features

- CSV upload for three data types: Student IHE Data, Clinical Placement, and
  Program & Student Info
- Role-based access control (superadmin, admin, editor, viewer)
- Student record search with URL-persisted filters
- Record editing with category-level permissions
- Data export to CSV with role-based column visibility
- Configuration-driven architecture via `config.yaml`
- Single-command deployment (`./deploy.sh`)
- Automated update script with backup and rollback (`scripts/update-app.sh`)
- Database backup and restore scripts
- Caddy reverse proxy with automatic TLS
- systemd auto-start service for production servers

### Known Issues (Field Testing)

| Area | Description | Status |
|------|-------------|--------|
| CSV upload | Large files (>5,000 rows) may time out on low-resource instances | Open |
| Clinical placements | Cascading district/school dropdowns occasionally require page refresh | Open |
| Export | "Admin Only" fields export rules not enforced in all edge cases | Open |
| UI | Back button after editing may lose unsaved filter state | Fixed (v1.0) |
| Filters | URL filter state not preserved across login redirect | Fixed (v1.0) |

### External Documentation

The following documents are maintained separately and are not included in this
repository:

- **PTT Technical Specification** — full requirements and data model
- **Job Aide Guides** — end-user quick-reference guides
- **CSV Templates** — downloadable from the Upload page at runtime
  (generated from `config.yaml`)

## Prior Updates (Pre-Release)

These updates were applied during the field-testing period:

- **2024-11-05** — Simplified deployment to 3-step process; added centralized
  `.env` configuration; Docker Compose hardening
- **2024-07-31** — Database persistence via volume mount; runtime
  initialization in entrypoint; filter state persistence via URL
- **2024-07-10** — Extended CORS configuration; Next.js environment variable
  pass-through; back-button and filter fixes
- **2024-06-24** — Initial field-testing deployment to IHE partners
