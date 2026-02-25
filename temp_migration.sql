create table if not exists public.user_2fa (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  secret text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_2fa_email_idx on public.user_2fa (email);

alter table public.user_2fa enable row level security;
