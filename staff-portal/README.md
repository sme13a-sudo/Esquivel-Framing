# EF Staff Portal (work in progress)

Server-backed username/password access with admin and staff project isolation. This is **not yet a deployed, security-tested production system**.

## Database
Requires a persistent PostgreSQL database; Neon is an option already connected to the Vercel account. No Supabase. Vercel serverless filesystem is not durable; never put a production SQLite database there.

## Local developer setup
1. Install Node.js 24+ and run `npm install` in this directory.
2. Set `DATABASE_URL` securely in the environment (see `.env.example`; Node does not load this file automatically).
3. Run `node migrate.mjs`.
4. Set `EF_ADMIN_USERNAME`, `EF_ADMIN_PASSWORD` (12+ characters), and optionally `EF_ADMIN_NAME`, then run `node create-admin.mjs` once.
5. Run `node server.mjs`. By default it listens on localhost:3001.

## Implemented
- Server-side credential verification using scrypt password hashes, hashed session tokens, 12-hour Secure/HttpOnly cookies.
- Initial per-IP in-memory login throttle (not suitable alone for multiple production instances).
- First-login password change requirement, invalidates sessions after password changes.
- Authenticated dashboard, project isolation, administrator user listing and assignment API.

## Before production release
- Connect persistent database and run migrations.
- Add admin user creation/deactivation/password reset, audited changes, access-request workflow, reports, and private file storage.
- Add CSRF protection to state-changing routes, distributed login rate limiting, and session revocation tests.
- Run security tests for project isolation and all administrator endpoints.
- Replace Node HTTP hosting with a supported deployment architecture; Vercel does not host this long-running server.mjs as-is.
- Add Staff Login entry to the marketing website only after production readiness.

Never commit database credentials or real employee records.
