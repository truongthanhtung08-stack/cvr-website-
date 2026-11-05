-- ============================================================================
-- 0068 — NHU CẦU "CẦN MUA" · "CẦN THUÊ" (chủ dự án 05/11/2026)
-- ----------------------------------------------------------------------------
-- Form đăng tin có một ô Nhu cầu: Cần bán · Cần mua · Cho thuê · Cần thuê.
-- CSDL trước đây chỉ nhận 'ban', 'thue' → khách chọn Cần mua / Cần thuê bấm Đăng là
-- lỗi "invalid input value for enum listing_purpose", không lưu được tin.
-- Thêm hai giá trị đúng như mã web ghi (src/lib/listingSpec.ts purposeOfDemand).
-- Chỉ THÊM, không đổi giá trị cũ, không đụng tin nào đang có.
-- ============================================================================
alter type public.listing_purpose add value if not exists 'mua';
alter type public.listing_purpose add value if not exists 'can-thue';
