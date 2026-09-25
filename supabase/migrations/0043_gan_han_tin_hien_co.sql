-- ============================================================================
-- 0043 — GẮN HẠN CHO CÁC TIN ĐANG CÓ TRÊN WEB (chạy MỘT LẦN, 25/09/2026)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt: tính hạn TỪ HÔM NAY (không tin nào biến mất đột ngột), theo
-- chuẩn gói:
--   · Diamond 7 ngày  → hết VIP 02/10/2026
--   · Gold, Silver 15 ngày → hết VIP 10/10/2026
--   · Hết VIP thì TỤT VỀ TIN THƯỜNG (khoá sau_vip_thuong_den), chạy tới 25/10
--   · Basic: chương trình miễn phí thành viên mới 1 tháng → 25/10/2026
-- Hết mốc cuối thì hết hạn như mọi tin (ngừng hiển thị, Up tin để hiện lại).
-- Chỉ đụng tin ĐANG ĐĂNG và CHƯA có hạn (tin nhập từ admin). Mốc = cuối ngày giờ VN.
-- ============================================================================
update public.listings
   set tier_expires_at = '2026-10-02 23:59:59+07',
       details = coalesce(details, '{}'::jsonb) || jsonb_build_object('sau_vip_thuong_den', '2026-10-25T23:59:59+07:00')
 where status = 'approved' and tier_expires_at is null and tier = 'diamond';

update public.listings
   set tier_expires_at = '2026-10-10 23:59:59+07',
       details = coalesce(details, '{}'::jsonb) || jsonb_build_object('sau_vip_thuong_den', '2026-10-25T23:59:59+07:00')
 where status = 'approved' and tier_expires_at is null and tier in ('gold', 'silver');

update public.listings
   set tier_expires_at = '2026-10-25 23:59:59+07'
 where status = 'approved' and tier_expires_at is null and tier = 'basic';
