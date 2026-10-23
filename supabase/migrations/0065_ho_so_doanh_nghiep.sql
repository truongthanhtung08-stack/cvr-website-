-- ============================================================================
-- 0065 — HỒ SƠ DOANH NGHIỆP (chủ dự án 23/10/2026: "khách cá nhân thì okie, doanh nghiệp
-- tập hợp thành 1 mục trên admin, tôi tự điền — làm đúng cái Google cần")
-- ----------------------------------------------------------------------------
-- Doanh nghiệp = profiles.role = 'company'. Trường Google cần cho Organization:
--   name = company_name · legalName = hd_ten_cong_ty · taxID = hd_mst · address = hd_dia_chi
--   email = hd_email · url = dn_website · logo = dn_logo · description = dn_gioi_thieu
--   sameAs = dn_mang_xa_hoi (mỗi dòng một link)
-- hd_* là thông tin hoá đơn có sẵn (0017) — cùng là thông tin pháp nhân nên dùng chung, không nhập hai lần.
-- dn_dong_y_dang: doanh nghiệp đồng ý cho đăng hồ sơ lên /chuyen-gia/cong-ty.
-- Chỉ thêm cột, không đổi dữ liệu cũ. Chi phí: không thêm truy vấn định kỳ, không cron.
-- ============================================================================

alter table public.profiles
  add column if not exists dn_website text,
  add column if not exists dn_logo text,
  add column if not exists dn_gioi_thieu text,
  add column if not exists dn_mang_xa_hoi text,
  add column if not exists dn_dong_y_dang boolean not null default false;
