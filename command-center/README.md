# EF Command Center — Local Only

This application is designed to run on a designated office computer or private local server. **No Supabase, hosted database, or cloud storage.** The existing static marketing site remains separate.

## Local stack
- Node.js 24+ with built-in `node:sqlite`.
- SQLite database at `command-center/data/ef-operations.sqlite` (ignored by Git).
- Private uploaded files in `command-center/data/uploads/` (ignored by Git).
- Bind to `127.0.0.1` by default. Do not expose to the public internet.
- Individual staff accounts, server-verified sessions, password hashes, and per-project access checks are required before real operations.

## Planned modules
Projects, crew assignments, access requests, daily field reports, photographs, documents, admin approvals and audit history.

## Development status
Local database initialization and schema included. **The authenticated web interface is not yet implemented.** Never store operational data in the public website or deploy this directory as a public app.

## Initialize
From a computer with Node.js 24+ installed:
```bash
cd command-center
node init-db.mjs
```
The script creates the database in `data/` and prints its path. Back up the entire `data/` folder securely. Do not commit it to Git.
