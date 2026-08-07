-- ============================================================================
-- 0012 — QUYỀN ĐĂNG DỰ ÁN (Chủ đầu tư / Công ty phân phối)
-- ----------------------------------------------------------------------------
-- Khách thường KHÔNG đăng được dự án. Muốn đăng phải gửi hồ sơ, quản trị viên
-- xét duyệt rồi bật quyền. Cách chạy: Supabase → SQL Editor → dán file → Run.
-- ============================================================================

-- 1) Cờ quyền trên hồ sơ người dùng ------------------------------------------
alter table public.profiles
  add column if not exists can_post_project boolean not null default false;

comment on column public.profiles.can_post_project is
  'Được đăng dự án hay không — chỉ admin bật sau khi duyệt hồ sơ CĐT/phân phối';

-- 2) Hồ sơ xin quyền đăng dự án ----------------------------------------------
create table if not exists public.project_poster_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,

  loai          text not null default 'chu_dau_tu',  -- chu_dau_tu | phan_phoi
  company_name  text not null,                       -- tên pháp nhân
  tax_code      text,                                -- mã số thuế
  website       text,
  contact_name  text,
  contact_phone text,
  note          text,                                -- lời nhắn của khách
  documents     text[] not null default '{}',        -- ảnh/scan giấy tờ (Storage)

  status        text not null default 'cho_duyet',   -- cho_duyet | da_duyet | tu_choi
  admin_note    text,                                -- lý do từ chối / ghi chú duyệt
  reviewed_by   uuid references public.profiles(id) on delete set null,
  reviewed_at   timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.project_poster_requests is
  'Hồ sơ xin quyền đăng dự án — admin duyệt thì bật profiles.can_post_project';

create index if not exists idx_ppr_status  on public.project_poster_requests (status, created_at desc);
create index if not exists idx_ppr_user    on public.project_poster_requests (user_id);

drop trigger if exists set_ppr_updated_at on public.project_poster_requests;
create trigger set_ppr_updated_at
  before update on public.project_poster_requests
  for each row execute function public.set_updated_at();

-- 3) RLS: khách chỉ thấy hồ sơ của mình, admin thấy hết ----------------------
alter table public.project_poster_requests enable row level security;

drop policy if exists ppr_select_own on public.project_poster_requests;
create policy ppr_select_own on public.project_poster_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists ppr_insert_own on public.project_poster_requests;
create policy ppr_insert_own on public.project_poster_requests
  for insert with check (auth.uid() = user_id);

-- Khách sửa được hồ sơ CHƯA duyệt của mình; admin sửa được mọi hồ sơ
drop policy if exists ppr_update on public.project_poster_requests;
create policy ppr_update on public.project_poster_requests
  for update using (
    (auth.uid() = user_id and status = 'cho_duyet') or public.is_admin()
  );

drop policy if exists ppr_delete_admin on public.project_poster_requests;
create policy ppr_delete_admin on public.project_poster_requests
  for delete using (public.is_admin());
