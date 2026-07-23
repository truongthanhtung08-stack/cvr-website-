-- ============================================================================
-- Dự án — cột `details` (JSONB) chứa dữ liệu CẤU TRÚC mới cho trang chi tiết:
--   purposes[]      Mục đích: 'ban' (bán) / 'thue' (cho thuê)
--   priceMode       'hidden' (mặc định — hiện "Liên hệ") | 'show' (hiện giá cụ thể)
--   priceTable[]    Bảng giá: {unit, area, direction, price}  (Loại căn–DT–Hướng–Giá)
--   floorPlans[]    Mặt bằng: {label, image, note}  (từng tháp/tầng/loại căn)
--   places[]        Tiện ích xung quanh: {category, name, distance}
--   developerInfo   Chủ đầu tư: {established, website, desc, logo}
-- Chạy: Supabase → SQL Editor → dán file → Run. An toàn chạy lại.
-- ============================================================================

alter table public.projects
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.projects.details is
  'Dữ liệu cấu trúc trang chi tiết dự án: purposes, priceMode, priceTable, floorPlans, places, developerInfo';
