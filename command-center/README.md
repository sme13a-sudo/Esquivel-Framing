# EF Command Center

Private operations application specification. This directory is **not** an authenticated application yet.

## Security requirements
- Dedicated backend and environment for Esquivel Framing; do not reuse the inactive 3454 Client Portal.
- Server-verified user identity and session; no client-only authentication or passwords in source control.
- Admin-managed user provisioning and deactivation.
- Role-based and project-specific authorization on every database query, file operation, and API route.
- Private project photos/documents with signed short-lived URLs.
- Immutable actor/time audit events for changes and submitted field reports.
- Staff project-access requests requiring administrator approval.

## Modules
1. Dashboard: assigned projects, pending reports, approvals.
2. Projects: site information, status, team assignments.
3. Crew: members, role, project access.
4. Field Reports: work performed, weather, crew, notes, photo attachments, submitted-by and timestamp.
5. Documents: drawings, RFIs, photos.
6. Admin: invitations, permissions, audit events.

## Deployment gate
Do not expose any command-center page or operational data on the static public site. Implement on an authenticated server-backed application and verify row-level access before release.
