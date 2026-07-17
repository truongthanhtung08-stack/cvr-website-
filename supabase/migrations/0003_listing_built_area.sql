-- ============================================================================
-- Tách diện tích: area_m2 = DIỆN TÍCH ĐẤT · thêm built_area_m2 = DIỆN TÍCH XÂY DỰNG
-- Chạy sau 0002_listings.sql. An toàn chạy lại (if not exists).
-- ============================================================================
alter table public.listings
  add column if not exists built_area_m2 numeric;

comment on column public.listings.area_m2 is 'Diện tích đất (m²)';
comment on column public.listings.built_area_m2 is 'Diện tích xây dựng (m²) — có thể null với đất nền';
