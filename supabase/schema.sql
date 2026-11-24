-- SA RIPPER schema for Supabase. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin'))
);
create or replace function public.is_sa_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.admin_profiles where user_id = auth.uid() and role = 'admin'); $$;

create table if not exists public.services (
 id uuid primary key default gen_random_uuid(), title text not null,
 description text, category text, price text, is_active boolean not null default true,
 sort_order int not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.notices (
 id uuid primary key default gen_random_uuid(), title text not null, body text not null,
 is_published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.events (
 id uuid primary key default gen_random_uuid(), title text not null, body text not null,
 is_published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.reviews (
 id uuid primary key default gen_random_uuid(), title text not null, body text not null,
 is_approved boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.applications (
 id uuid primary key default gen_random_uuid(), nickname text not null,
 category text not null, contact text, details text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.site_settings (
 key text primary key, value text not null
);

alter table public.admin_profiles enable row level security;
alter table public.services enable row level security;
alter table public.notices enable row level security;
alter table public.events enable row level security;
alter table public.reviews enable row level security;
alter table public.applications enable row level security;
alter table public.site_settings enable row level security;

-- Admin membership is only manageable by an existing admin using the SQL dashboard.
create policy "admins can read admin profiles" on public.admin_profiles for select to authenticated using (public.is_sa_admin());
create policy "public read active services" on public.services for select to anon, authenticated using (is_active = true or public.is_sa_admin());
create policy "admins manage services" on public.services for all to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());
create policy "public read published notices" on public.notices for select to anon, authenticated using (is_published = true or public.is_sa_admin());
create policy "admins manage notices" on public.notices for all to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());
create policy "public read published events" on public.events for select to anon, authenticated using (is_published = true or public.is_sa_admin());
create policy "admins manage events" on public.events for all to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());
create policy "public read approved reviews" on public.reviews for select to anon, authenticated using (is_approved = true or public.is_sa_admin());
create policy "admins manage reviews" on public.reviews for all to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());
create policy "visitors can submit applications" on public.applications for insert to anon, authenticated with check (length(nickname) between 1 and 60 and length(details) between 1 and 3000);
create policy "admins read applications" on public.applications for select to authenticated using (public.is_sa_admin());
create policy "admins update applications" on public.applications for update to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());
create policy "public read kakao setting" on public.site_settings for select to anon, authenticated using (key = 'kakao_url');
create policy "admins manage settings" on public.site_settings for all to authenticated using (public.is_sa_admin()) with check (public.is_sa_admin());

-- Add an admin only AFTER creating that user in Supabase Authentication.
-- Replace the UUID below with the created auth.users.id:
-- insert into public.admin_profiles(user_id, role) values ('YOUR-AUTH-USER-UUID', 'admin');

-- Example starter service (optional):
-- insert into public.services(title, description, category, price, sort_order)
-- values ('랭크전 관련 상담', '서비스 범위와 가능 여부를 상담합니다.', '랭크전', '상담 후 안내', 1);
