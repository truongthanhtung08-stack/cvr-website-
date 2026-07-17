-- ============================================================================
-- Cột `details` (JSONB) — lưu THẬT các thuộc tính linh hoạt của tin đăng để
-- Admin nhập gì thì web hiện đúng nấy (hết cảnh trang chi tiết "bịa" dữ liệu).
-- Cấu trúc details (do form ghi vào):
--   {
--     "specs":      { "<key>": "<giá trị>" },   -- đặc điểm theo loại hình (listingSpec.ts)
--     "interior":   ["Điều hòa", "Tủ bếp", ...], -- nội thất có sẵn
--     "amenities":  ["Hồ bơi", "Gym", ...],      -- tiện ích
--     "legal":      "Sổ đỏ / Sổ hồng",
--     "furnish":    "Nội thất đầy đủ",
--     "addressDetail": "123 Võ Nguyên Giáp",
--     "contact":    { "name": "...", "phone": "...", "email": "..." }
--   }
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================
alter table public.listings
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.listings.details is 'Thuộc tính tin (đặc điểm/nội thất/tiện ích/pháp lý/người đăng) — nguồn hiển thị thật cho trang chi tiết';
