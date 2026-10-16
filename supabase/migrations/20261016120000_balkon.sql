-- Balkon: gedeelde data voor twee accounts.
--
-- Beveiliging: alle tabellen hebben RLS. Elke ingelogde gebruiker hoort bij
-- het "huishouden", dus zet in Supabase onder Authentication > Sign In /
-- Providers "Allow new users to sign up" UIT en maak de twee accounts zelf aan.

-- ---------------------------------------------------------------- profielen
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  spotify_connected boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), initcap(split_part(new.email, '@', 1))))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts die al bestonden ook een profiel geven.
insert into public.profiles (id, name)
select id, coalesce(nullif(raw_user_meta_data ->> 'name', ''), initcap(split_part(email, '@', 1)))
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------- planten
create table if not exists public.plants (
  id text primary key check (id in ('tomaat', 'basilicum')),
  name text not null,
  place text not null default '',
  moisture_pct int not null default 50 check (moisture_pct between 0 and 100),
  moisture_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,                       -- 'YYYY-MM-DD:plant:soort'
  plant_id text not null check (plant_id in ('tomaat', 'basilicum')),
  kind text not null check (kind in ('water', 'binnen', 'oogst')),
  title text not null,
  detail text not null default '',
  done boolean not null default false,
  date date not null,
  prev_moisture_pct int,
  prev_moisture_at timestamptz,
  updated_by uuid default auth.uid() references auth.users on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists tasks_date_idx on public.tasks (date);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  text text not null check (char_length(text) between 1 and 2000),
  plant_id text not null check (plant_id in ('tomaat', 'basilicum')),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists notes_created_idx on public.notes (created_at desc);

-- ---------------------------------------------------------------- shit counter
create table if not exists public.poops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  grade smallint check (grade between 1 and 10),
  logged_by uuid not null default auth.uid() references auth.users on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists poops_created_idx on public.poops (created_at);

-- ---------------------------------------------------------------- muziek
create table if not exists public.plays (
  user_id uuid not null references auth.users on delete cascade,
  played_at timestamptz not null,
  track_id text not null,
  track_name text not null,
  artist_id text,
  artist_name text not null,
  image_url text,
  duration_ms int not null,
  primary key (user_id, played_at)
);
create index if not exists plays_played_idx on public.plays (played_at);

-- Alleen voor de Edge Functions (service role); de app kan hier niet bij.
create table if not exists public.spotify_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_token text not null,
  access_token text,
  expires_at timestamptz,
  last_played_at timestamptz,
  last_sync_at timestamptz,
  last_error text
);

create table if not exists public.spotify_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users on delete cascade,
  return_to text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.plants enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.poops enable row level security;
alter table public.plays enable row level security;
alter table public.spotify_tokens enable row level security;
alter table public.spotify_oauth_states enable row level security;

drop policy if exists "huishouden leest profielen" on public.profiles;
create policy "huishouden leest profielen" on public.profiles for select to authenticated using (true);
drop policy if exists "eigen naam aanpassen" on public.profiles;
create policy "eigen naam aanpassen" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- Alleen de naam mag vanuit de app veranderen; spotify_connected zet de server.
revoke update on public.profiles from authenticated, anon;
grant update (name) on public.profiles to authenticated;

drop policy if exists "huishouden planten" on public.plants;
create policy "huishouden planten" on public.plants for all to authenticated using (true) with check (true);

drop policy if exists "huishouden taken" on public.tasks;
create policy "huishouden taken" on public.tasks for all to authenticated using (true) with check (true);

drop policy if exists "huishouden leest notities" on public.notes;
create policy "huishouden leest notities" on public.notes for select to authenticated using (true);
drop policy if exists "eigen notitie schrijven" on public.notes;
create policy "eigen notitie schrijven" on public.notes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "eigen notitie wissen" on public.notes;
create policy "eigen notitie wissen" on public.notes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "huishouden leest poep" on public.poops;
create policy "huishouden leest poep" on public.poops for select to authenticated using (true);
drop policy if exists "poep bijschrijven" on public.poops;
create policy "poep bijschrijven" on public.poops for insert to authenticated
  with check (logged_by = (select auth.uid()) and exists (select 1 from public.profiles p where p.id = user_id));
drop policy if exists "oeps" on public.poops;
create policy "oeps" on public.poops for delete to authenticated using (true);

drop policy if exists "huishouden leest muziek" on public.plays;
create policy "huishouden leest muziek" on public.plays for select to authenticated using (true);

-- ---------------------------------------------------------------- realtime
do $$
declare t text;
begin
  foreach t in array array['profiles', 'plants', 'tasks', 'notes', 'poops', 'plays'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
