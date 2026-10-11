# EF Command Center — website-accessible staff portal

## Confirmed product requirements
- Workers open the Esquivel Framing website on mobile or desktop.
- Administrator issues individual usernames and temporary passwords; users change password on first login.
- Admin creates, disables, and resets accounts and grants access to specific projects.
- Workers see **only** assigned projects, drawings, documents, and daily reports.
- Workers can request additional project access; only admin can approve.
- Admin sees who submitted a report and when, with an audit trail.
- No Supabase.

## Hosting architecture
- Existing static marketing pages can remain unchanged.
- `/staff` must route to a server-rendered authenticated app, **not** a static HTML password screen.
- Use a persistent managed SQL database or a separately hosted persistent SQLite volume; never write SQLite to Vercel function local disk, which is ephemeral.
- Passwords hashed using Argon2id; random opaque session tokens stored only as hashes in database; Secure, HttpOnly, SameSite cookies.
- Server-side role and per-project authorization on every API, document, photo, and report request.
- Uploaded files private, with authenticated download endpoints. HTTPS required.
- Rate limit login and log account changes. Keep secrets in deployment environment, never Git.

## Status
Requirements documented; **no deployed login, database, or working dashboard yet**. Do not create dummy login pages that imply real protection.

## Next implementation
Choose persistent backend hosting and database, implement server app, migration, admin bootstrap, login/logout/password change, then project assignment and reports. Run access-control tests before exposing to staff.
