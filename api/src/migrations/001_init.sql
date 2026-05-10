create table if not exists users (
  sub text primary key,
  email text,
  name text,
  is_admin boolean not null default false,
  last_login timestamptz not null default now()
);

create table if not exists scans (
  id bigserial primary key,
  url text not null,
  cf_uuid text,
  status text not null check (status in ('pending','ready','error')),
  error text,
  result jsonb,
  requested_by text references users(sub) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists scans_requested_by_idx on scans (requested_by, created_at desc);

create table if not exists technologies (
  slug text primary key,
  name text not null,
  categories text[] not null default '{}',
  roast_text text,
  rating smallint check (rating between 1 and 5),
  logo_filename text,
  updated_at timestamptz not null default now(),
  updated_by text references users(sub) on delete set null
);

create table if not exists scan_technologies (
  scan_id bigint not null references scans(id) on delete cascade,
  tech_slug text not null references technologies(slug) on delete cascade,
  confidence smallint,
  primary key (scan_id, tech_slug)
);

create table if not exists session (
  sid varchar not null collate "default" primary key,
  sess json not null,
  expire timestamp(6) not null
) with (oids = false);

create index if not exists session_expire_idx on session (expire);
