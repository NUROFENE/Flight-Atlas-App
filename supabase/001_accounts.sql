-- Flight Atlas: run once in Supabase SQL Editor
-- No passwords are stored in these tables. Authentication belongs to Supabase Auth.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null default 'Пилот' check (char_length(nickname) between 1 and 40),
 avatar_url text,
 created_at timestamptz not null default now()
);
create table if not exists public.flights (
 id uuid primary key default gen_random_uuid(),
 pilot_id uuid not null references auth.users(id) on delete cascade,
 flight_number text not null default '',
 airline text not null default '',
 origin text not null check (char_length(origin) between 3 and 4),
 destination text not null check (char_length(destination) between 3 and 4),
 aircraft text not null default '',
 started_at timestamptz,
 completed_at timestamptz not null default now(),
 duration_minutes integer check(duration_minutes between 0 and 43200),
 landing_fpm integer check(landing_fpm between -5000 and 5000),
 created_at timestamptz not null default now()
);
create index if not exists flights_pilot_date_idx on public.flights(pilot_id,completed_at desc);
alter table public.profiles enable row level security;
alter table public.flights enable row level security;
revoke all on public.profiles from anon;
revoke all on public.flights from anon;
grant select,insert,update,delete on public.profiles to authenticated;
grant select,insert,update,delete on public.flights to authenticated;
drop policy if exists "Profile owner read" on public.profiles;
drop policy if exists "Profile owner insert" on public.profiles;
drop policy if exists "Profile owner update" on public.profiles;
create policy "Profile owner read" on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy "Profile owner insert" on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy "Profile owner update" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
drop policy if exists "Flight owner read" on public.flights;
drop policy if exists "Flight owner insert" on public.flights;
drop policy if exists "Flight owner update" on public.flights;
drop policy if exists "Flight owner delete" on public.flights;
create policy "Flight owner read" on public.flights for select to authenticated using (pilot_id=(select auth.uid()));
create policy "Flight owner insert" on public.flights for insert to authenticated with check (pilot_id=(select auth.uid()));
create policy "Flight owner update" on public.flights for update to authenticated using (pilot_id=(select auth.uid())) with check (pilot_id=(select auth.uid()));
create policy "Flight owner delete" on public.flights for delete to authenticated using (pilot_id=(select auth.uid()));
-- Public leaderboard without email or private flight records.
-- Security definer is needed because participants otherwise cannot query other people's RLS-protected flights.
create or replace function public.monthly_leaderboard(target_month date default date_trunc('month',now())::date)
returns table(pilot_id uuid,nickname text,flight_count bigint,total_minutes bigint)
language sql stable security definer set search_path = ''
as $$
 select p.id,p.nickname,count(f.id),coalesce(sum(f.duration_minutes),0)::bigint
 from public.profiles p
 join public.flights f on f.pilot_id=p.id
 where f.completed_at>=date_trunc('month',target_month::timestamp)
 and f.completed_at<date_trunc('month',target_month::timestamp)+interval '1 month'
 group by p.id,p.nickname order by count(f.id) desc,coalesce(sum(f.duration_minutes),0) desc limit 100;
$$;
revoke all on function public.monthly_leaderboard(date) from public,anon;
grant execute on function public.monthly_leaderboard(date) to authenticated;
