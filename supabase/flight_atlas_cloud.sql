-- Flight Atlas cloud data schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.atlas_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 pilot_number bigint generated always as identity unique,
 nickname text not null default 'Пилот' check (char_length(nickname) between 1 and 40),
 role text not null default 'user' check (role in ('user','admin')),
 created_at timestamptz not null default now()
);
create unique index if not exists atlas_profiles_pilot_number_idx on public.atlas_profiles(pilot_number);
create or replace function public.atlas_new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.atlas_profiles(id,nickname) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'nickname',40),''),'Пилот')) on conflict(id) do nothing;
 return new;
end $$;
drop trigger if exists atlas_auth_registered on auth.users;
create trigger atlas_auth_registered after insert on auth.users for each row execute function public.atlas_new_profile();
insert into public.atlas_profiles(id,nickname)
select u.id, coalesce(nullif(left(u.raw_user_meta_data->>'nickname',40),''),'Пилот') from auth.users u
on conflict(id) do nothing;
create or replace function public.atlas_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.atlas_profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.atlas_is_admin() from public;
grant execute on function public.atlas_is_admin() to authenticated;
alter table public.atlas_profiles enable row level security;
drop policy if exists atlas_profiles_read on public.atlas_profiles;
create policy atlas_profiles_read on public.atlas_profiles for select to authenticated using (true);
drop policy if exists atlas_profiles_update on public.atlas_profiles;
create policy atlas_profiles_update on public.atlas_profiles for update to authenticated using (id=(select auth.uid())) with check(id=(select auth.uid()));
revoke insert,delete on public.atlas_profiles from anon,authenticated;
revoke update on public.atlas_profiles from anon,authenticated;
grant update(nickname) on public.atlas_profiles to authenticated;
grant select on public.atlas_profiles to authenticated;
create table if not exists public.atlas_content (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('mod','flight')),
 payload jsonb not null default '{}'::jsonb,
 published boolean not null default false,
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id)
);
create index if not exists atlas_content_filter_idx on public.atlas_content(kind,published,updated_at desc);
alter table public.atlas_content enable row level security;
drop policy if exists atlas_content_read on public.atlas_content;
create policy atlas_content_read on public.atlas_content for select to anon,authenticated using(published or public.atlas_is_admin());
drop policy if exists atlas_content_insert on public.atlas_content;
create policy atlas_content_insert on public.atlas_content for insert to authenticated with check(public.atlas_is_admin() and updated_by=(select auth.uid()));
drop policy if exists atlas_content_update on public.atlas_content;
create policy atlas_content_update on public.atlas_content for update to authenticated using(public.atlas_is_admin()) with check(public.atlas_is_admin() and updated_by=(select auth.uid()));
drop policy if exists atlas_content_delete on public.atlas_content;
create policy atlas_content_delete on public.atlas_content for delete to authenticated using(public.atlas_is_admin());
grant select on public.atlas_content to anon,authenticated;
grant insert,update,delete on public.atlas_content to authenticated;
create table if not exists public.atlas_flights (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 entry_key text not null,
 orig text, dest text, flight text,
 started_at timestamptz,
 completed_at timestamptz not null,
 duration_minutes integer not null default 0 check(duration_minutes between 0 and 1440),
 landing_fpm integer,
 unique(user_id,entry_key)
);
create index if not exists atlas_flights_user_date on public.atlas_flights(user_id,completed_at desc);
alter table public.atlas_flights enable row level security;
drop policy if exists atlas_flights_read on public.atlas_flights;
create policy atlas_flights_read on public.atlas_flights for select to authenticated using(true);
drop policy if exists atlas_flights_insert on public.atlas_flights;
create policy atlas_flights_insert on public.atlas_flights for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists atlas_flights_update on public.atlas_flights;
create policy atlas_flights_update on public.atlas_flights for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.atlas_flights from anon;
grant select,insert,update on public.atlas_flights to authenticated;
-- BOOTSTRAP: replace the email with YOUR registered email. Run separately after signup:
-- update public.atlas_profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
-- Never expose a Supabase service_role key in this desktop application.

-- Admin-only image upload storage
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('atlas-mod-images','atlas-mod-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
drop policy if exists atlas_image_admin_insert on storage.objects;
create policy atlas_image_admin_insert on storage.objects for insert to authenticated with check(bucket_id='atlas-mod-images' and public.atlas_is_admin());
drop policy if exists atlas_image_admin_update on storage.objects;
create policy atlas_image_admin_update on storage.objects for update to authenticated using(bucket_id='atlas-mod-images' and public.atlas_is_admin()) with check(bucket_id='atlas-mod-images' and public.atlas_is_admin());
drop policy if exists atlas_image_public_read on storage.objects;
create policy atlas_image_public_read on storage.objects for select to public using(bucket_id='atlas-mod-images');

-- Admin-only role assignment via public Flight Atlas ID.
create or replace function public.atlas_set_role(target_pilot_number bigint, target_role text)
returns boolean language plpgsql security definer set search_path='' as $$
declare target_id uuid;
begin
 if not public.atlas_is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
 if target_role not in ('user','admin') then raise exception 'Invalid role'; end if;
 select id into target_id from public.atlas_profiles where pilot_number=target_pilot_number;
 if target_id is null then raise exception 'Pilot ID not found'; end if;
 if target_id=(select auth.uid()) and target_role='user' then raise exception 'Cannot demote yourself'; end if;
 update public.atlas_profiles set role=target_role where id=target_id;
 return true;
end $$;
revoke all on function public.atlas_set_role(bigint,text) from public;
grant execute on function public.atlas_set_role(bigint,text) to authenticated;
