CREATE TABLE IF NOT EXISTS ef_users(id uuid PRIMARY KEY,username text NOT NULL UNIQUE,display_name text NOT NULL,password_hash text NOT NULL,role text NOT NULL CHECK(role IN ('admin','staff')),active boolean NOT NULL DEFAULT true,must_change_password boolean NOT NULL DEFAULT true);
CREATE TABLE IF NOT EXISTS ef_sessions(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES ef_users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS ef_projects(id uuid PRIMARY KEY,name text NOT NULL,address text,status text NOT NULL DEFAULT 'active');
CREATE TABLE IF NOT EXISTS ef_project_members(project_id uuid REFERENCES ef_projects(id) ON DELETE CASCADE,user_id uuid REFERENCES ef_users(id) ON DELETE CASCADE,PRIMARY KEY(project_id,user_id));
CREATE INDEX IF NOT EXISTS ef_sessions_expiry ON ef_sessions(expires_at);
