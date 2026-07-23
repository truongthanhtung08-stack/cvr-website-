-- ============================================================================
-- NỘI DUNG TĨNH TRANG WEB (CMS nhẹ) — bảng `site_content`
-- Mỗi khối nội dung (Hero, khu vực, tin tức, banner, footer, giới thiệu…) là 1 hàng,
-- key = định danh khối, data = JSON chứa chữ + đường dẫn ảnh của khối đó.
-- Component đọc từ đây; chưa nhập khối nào → dùng nội dung mặc định trong code.
-- Chạy: Supabase → SQL Editor → dán file → Run. An toàn chạy lại.
-- ============================================================================

create table if not exists public.site_content (
  key        text primary key,          -- vd 'hero_home', 'areas', 'footer', 'about'
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_content is 'Nội dung tĩnh trang web (chữ + ảnh) admin tự sửa — Coastal Land';

-- cập nhật updated_at tự động (dùng lại hàm set_updated_at từ 0001_profiles.sql)
drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;

-- Đọc: mọi người (nội dung công khai của web). Ghi: chỉ admin.
drop policy if exists "site_content_read" on public.site_content;
create policy "site_content_read" on public.site_content
  for select using ( true );

drop policy if exists "site_content_write_admin" on public.site_content;
create policy "site_content_write_admin" on public.site_content
  for all using ( public.is_admin() ) with check ( public.is_admin() );
