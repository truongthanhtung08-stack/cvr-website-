-- ============================================================================
-- WEB PHẢI THẬT (18/7): xoá 33 TIN MẪU seed từ lúc dev (0002) khỏi production.
-- Tin mẫu có id dạng SỐ ('1'..'33') — tin thật của khách là UUID nên không bị đụng.
-- Sau khi chạy: web chỉ còn tin thật đã duyệt; mục chưa có tin hiện trống thật
-- (code đã bỏ độn dữ liệu mẫu — commit cùng ngày).
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (lần 2 xoá 0 dòng).
-- ============================================================================

delete from public.listings where id ~ '^[0-9]+$';
