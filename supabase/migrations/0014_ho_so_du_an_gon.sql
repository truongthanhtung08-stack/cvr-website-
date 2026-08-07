-- ============================================================================
-- 0014 — YÊU CẦU ĐĂNG DỰ ÁN: GỌN LẠI
-- ----------------------------------------------------------------------------
-- Khách chỉ gửi: HỌ TÊN · SỐ ĐIỆN THOẠI · TÊN DỰ ÁN muốn đăng.
-- Giấy tờ pháp nhân do quản trị viên kiểm ở khâu DUYỆT (nhận ngoài web).
-- Chạy SAU 0012. Cách chạy: Supabase → SQL Editor → dán file → Run.
-- ============================================================================

-- Tên dự án khách muốn đăng — thông tin chính để quản trị viên hình dung
alter table public.project_poster_requests
  add column if not exists project_name text;

comment on column public.project_poster_requests.project_name is
  'Tên dự án khách muốn đăng — gửi kèm yêu cầu';

-- Tên công ty KHÔNG còn bắt buộc (khách gửi nhanh, chưa cần khai pháp nhân)
alter table public.project_poster_requests
  alter column company_name drop not null;
