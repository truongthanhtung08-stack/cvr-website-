-- ============================================================================
-- B3 — NỘI DUNG ADMIN TỰ TẠO: bảng `articles` (Tin tức) + `projects` (Dự án)
-- Chạy SAU 0001_profiles.sql (dùng lại is_admin() và set_updated_at()).
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ file → Run. An toàn chạy lại.
-- ============================================================================

-- Trạng thái nội dung: nháp (chỉ admin thấy) → đã đăng (hiện trên web)
do $$ begin
  create type public.content_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

-- 1) BẢNG articles — bài viết Tin tức ----------------------------------------
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- URL /tin-tuc/[slug]
  title        text not null,
  excerpt      text,                          -- mô tả ngắn (thẻ bài viết)
  category     text not null default 'Tin tức',
  content      text,                          -- nội dung — mỗi đoạn 1 dòng
  image        text,                          -- ảnh đại diện (path hoặc URL)
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.articles is 'Bài viết Tin tức Coastal Land — admin tự tạo';

create index if not exists idx_articles_status_pub on public.articles (status, published_at desc);

drop trigger if exists trg_articles_updated_at on public.articles;
create trigger trg_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

drop policy if exists "articles_select_published_or_admin" on public.articles;
create policy "articles_select_published_or_admin" on public.articles
  for select using ( status = 'published' or public.is_admin() );

drop policy if exists "articles_write_admin" on public.articles;
create policy "articles_write_admin" on public.articles
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- 2) BẢNG projects — dự án BĐS -----------------------------------------------
create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,          -- URL /du-an/[slug]
  name         text not null,
  ward         text,                          -- Phường/Xã   (khớp src/lib/locations.ts)
  district     text,                          -- Quận/Huyện
  province     text,                          -- Tỉnh/Thành
  price_from   text,                          -- "Từ 3,2 tỷ" (chuỗi hiển thị)
  type         text,                          -- "Căn hộ cao cấp ven sông"…
  status_text  text not null default 'Đang mở bán', -- Sắp mở bán / Đang mở bán / Sắp bàn giao / Đã bàn giao
  developer    text,                          -- chủ đầu tư
  images       text[] not null default '{}',  -- phần tử đầu = ảnh đại diện
  scale        jsonb  not null default '[]',  -- [{label, value}] bảng quy mô
  amenities    text[] not null default '{}',  -- tiện ích
  overview     text,                          -- tổng quan — mỗi đoạn 1 dòng
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.projects is 'Dự án BĐS Coastal Land — admin tự tạo';

create index if not exists idx_projects_status_pub on public.projects (status, published_at desc);
create index if not exists idx_projects_province   on public.projects (province);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_select_published_or_admin" on public.projects;
create policy "projects_select_published_or_admin" on public.projects
  for select using ( status = 'published' or public.is_admin() );

drop policy if exists "projects_write_admin" on public.projects;
create policy "projects_write_admin" on public.projects
  for all using ( public.is_admin() ) with check ( public.is_admin() );
