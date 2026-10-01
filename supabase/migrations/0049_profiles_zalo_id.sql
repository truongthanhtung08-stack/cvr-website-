-- ============================================================================
-- 0049 — ZALO GẮN VÀO ĐÚNG MỘT TÀI KHOẢN (01/10/2026)
-- ----------------------------------------------------------------------------
-- 1 SỐ ĐIỆN THOẠI = 1 TÀI KHOẢN (chủ dự án chốt). Đăng nhập Zalo trên web không có số,
-- nên lần đầu tạo tài khoản theo Zalo; khi khách khai số lúc đăng tin mà số đó đã có
-- tài khoản cũ → tài khoản Zalo NHẬP VÀO tài khoản cũ và Zalo được GẮN sang tài khoản cũ.
-- Đăng nhập Zalo luôn tìm theo cột này trước → vào đúng tài khoản cũ, không đẻ thêm.
-- ============================================================================
alter table public.profiles add column if not exists zalo_id text;

create unique index if not exists profiles_zalo_id_key
  on public.profiles (zalo_id) where zalo_id is not null;
