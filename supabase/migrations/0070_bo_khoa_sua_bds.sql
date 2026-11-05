-- ============================================================================
-- 0070 — BỎ KHOÁ "CÙNG BẤT ĐỘNG SẢN" KHI KHÁCH SỬA TIN ĐÃ ĐĂNG (chủ dự án 06/11/2026: "sửa tin là sửa được tất cả, TRỪ GÓI TIN"
-- · "chỉnh ngay"). Thay luật 0045: khách sửa được cả mục đích, loại hình, tỉnh, phường, địa chỉ của tin đã đăng.
-- Gói tin (tier, hạn, tiền…) VẪN chặn ở trigger protect_listing_privileged (0037/0066) — không đổi.
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================
drop trigger if exists trg_giu_nguyen_bds on public.listings;
