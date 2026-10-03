-- ============================================================================
-- KHO GIÁ THEO THÁNG: THÊM DÃY THEO DỰ ÁN (chủ dự án chốt 03/10/2026)
--
-- Lịch sử giá so cùng phân khúc, cùng vị trí: cùng dự án → cùng phường. Kho cũ chỉ
-- gom theo phường; thêm cột du_an để gom riêng tin của từng dự án.
--   du_an = ''  → dòng theo phường
--   du_an = slug dự án → dòng theo dự án (phuong = '')
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- ============================================================================

alter table public.gia_khu_vuc_thang add column if not exists du_an text not null default '';

alter table public.gia_khu_vuc_thang drop constraint if exists gia_khu_vuc_thang_pkey;
alter table public.gia_khu_vuc_thang
  add constraint gia_khu_vuc_thang_pkey
  primary key (thang, tinh, phuong, loai_hinh, muc_dich, du_an);
