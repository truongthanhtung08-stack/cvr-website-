-- ============================================================================
-- B1 — DANH TÍNH: bảng `profiles` + RLS + trigger tự tạo hồ sơ
-- Nguồn thiết kế: docs/LO_TRINH_XAY_WEB.md mục 4.1
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ file → Run (hoặc supabase db push).
-- ⚠️ CHƯA chạy cho tới khi chủ dự án duyệt. Schema khó hoàn tác.
-- ============================================================================

-- 1) KIỂU LIỆT KÊ (enum) --------------------------------------------------------
create type public.user_role   as enum ('buyer', 'agent', 'company', 'admin');
create type public.user_status as enum ('active', 'pending', 'suspended');

-- 2) BẢNG profiles (gắn 1-1 với auth.users) ------------------------------------
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  phone           text,                                  -- định danh chính ở VN
  phone_verified  boolean          not null default false, -- OTP Zalo/SMS
  email           text,
  role            public.user_role not null default 'buyer',
  status          public.user_status not null default 'active',
  company_name    text,                                  -- nếu role = company
  plan            text,                                  -- slug gói (null = Basic free)
  plan_expires_at timestamptz,
  free_quota      int              not null default 3,   -- HẠN MỨC tin Basic miễn phí giữ đồng thời
                                                          -- (B2 đếm tin free đang đăng để so, KHÔNG trừ dần)
  avatar_url      text,
  city            text,                                  -- Đà Nẵng / Huế / ...
  created_at      timestamptz      not null default now(),
  updated_at      timestamptz      not null default now()
);

comment on table public.profiles is 'Hồ sơ người dùng Coastal Land, gắn 1-1 với auth.users';

-- 3) Tự cập nhật updated_at ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4) Hàm kiểm tra admin (SECURITY DEFINER → bỏ qua RLS, tránh đệ quy policy) -----
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 5) Tự tạo hồ sơ khi có user mới đăng ký ---------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Chặn người thường tự sửa cột đặc quyền -------------------------------------
--    (role / status / plan / quota / phone_verified — chỉ admin hoặc hệ thống được đổi)
create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() null = chạy bằng service_role / SQL Editor / Edge Function → cho phép
  -- (dùng để bootstrap admin đầu tiên và cho payos-webhook cập nhật gói).
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.role            is distinct from old.role
     or new.status       is distinct from old.status
     or new.plan         is distinct from old.plan
     or new.plan_expires_at is distinct from old.plan_expires_at
     or new.free_quota   is distinct from old.free_quota
     or new.phone_verified is distinct from old.phone_verified then
    raise exception 'Không được sửa cột đặc quyền (role/status/plan/quota/phone_verified)';
  end if;

  return new;
end;
$$;

create trigger trg_profiles_protect_privileged
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- 7) RLS ------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Đọc: tự đọc hồ sơ mình; admin đọc tất cả
create policy "profiles_select_self_or_admin" on public.profiles
  for select using ( id = auth.uid() or public.is_admin() );

-- Thêm: tự thêm đúng hàng của mình (trigger #5 đã lo, đây là fallback)
create policy "profiles_insert_self" on public.profiles
  for insert with check ( id = auth.uid() );

-- Sửa: tự sửa hồ sơ mình (cột đặc quyền bị trigger #6 chặn); admin sửa tất cả
create policy "profiles_update_self_or_admin" on public.profiles
  for update using ( id = auth.uid() or public.is_admin() )
           with check ( id = auth.uid() or public.is_admin() );

-- Xoá: chỉ admin
create policy "profiles_delete_admin" on public.profiles
  for delete using ( public.is_admin() );

-- ============================================================================
-- BOOTSTRAP ADMIN (chạy 1 lần, SAU khi bạn đã đăng ký tài khoản của mình):
--   update public.profiles set role = 'admin'
--   where email = 'truongthanhtung08@gmail.com';
-- ============================================================================
