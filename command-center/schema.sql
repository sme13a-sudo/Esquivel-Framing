-- EF Command Center proposed PostgreSQL schema.
-- NOT applied to any database. Review RLS policies before deployment.
create extension if not exists pgcrypto;
create table ef_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('admin','staff')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table ef_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  status text not null default 'active' check (status in ('planned','active','paused','completed')),
  created_at timestamptz not null default now()
);
create table ef_project_members (
  project_id uuid not null references ef_projects(id) on delete cascade,
  user_id uuid not null references ef_profiles(user_id) on delete cascade,
  primary key(project_id,user_id)
);
create table ef_access_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references ef_projects(id),
  user_id uuid not null references ef_profiles(user_id),
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  reviewed_by uuid references ef_profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table ef_daily_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references ef_projects(id),
  submitted_by uuid not null references ef_profiles(user_id),
  report_date date not null,
  work_summary text not null,
  crew_count integer check (crew_count >= 0),
  created_at timestamptz not null default now()
);
create table ef_report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references ef_daily_reports(id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid not null references ef_profiles(user_id),
  created_at timestamptz not null default now()
);
create table ef_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references ef_profiles(user_id),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  occurred_at timestamptz not null default now()
);
-- Fail closed until explicit tested policies are installed.
alter table ef_profiles enable row level security;
alter table ef_projects enable row level security;
alter table ef_project_members enable row level security;
alter table ef_access_requests enable row level security;
alter table ef_daily_reports enable row level security;
alter table ef_report_photos enable row level security;
alter table ef_audit_events enable row level security;
