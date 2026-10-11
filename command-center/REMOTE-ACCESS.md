# EF Command Center — remote access decision

## Approved
Workers must access the Esquivel Framing staff portal from **anywhere** via HTTPS on phones, tablets, and desktops. Admin provisions individual username/password accounts and controls project-level permissions. No Supabase.

## Required infrastructure
- Website route `/staff` served by a server-side authenticated app; the static marketing site alone cannot safely authenticate users.
- Durable hosted database (e.g. managed PostgreSQL) and private file storage; local-only SQLite on Vercel is unsuitable because function disks are ephemeral.
- Store password hashes (Argon2id), never plaintext passwords. First-login password reset, secure session cookies, rate limits, and audit logging.
- Enforce admin/staff and project membership checks on the server for every route, API, report, and attachment.
- Admin account invitation/disable/reset, project assignments, access request approvals, report attribution, and private file downloads.

## Release gates
1. Select persistent hosted database and private file storage (no Supabase).
2. Implement authenticated backend and database migrations.
3. Verify cross-project isolation, disabled-user revocation, and login throttling.
4. Integrate staff entry point into EF website and deploy after tests.

**Status:** Remote-access requirement committed. No live staff login or operational backend yet.
