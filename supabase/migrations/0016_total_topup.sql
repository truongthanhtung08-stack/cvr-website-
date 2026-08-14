-- ============================================================================
-- CẤP HỘI VIÊN XÉT THEO TỔNG TIỀN ĐÃ NẠP
-- ----------------------------------------------------------------------------
-- Trước đây web xếp cấp theo profiles.total_spend (tiền đã TIÊU). Nay đổi sang
-- tổng tiền đã NẠP vào ví: khách nạp bao nhiêu là tính bấy nhiêu, tiền còn
-- trong ví vẫn được tính cấp.
--
-- Bốn cấp (mốc mặc định, chủ dự án sửa được ở /admin/gia-khuyen-mai):
--   Basic 0đ · Silver 5.000.000đ · Gold 20.000.000đ · Diamond 50.000.000đ
--
-- Chạy trong Supabase → SQL Editor → New query → dán toàn bộ → Run.
-- Chạy được nhiều lần, không mất dữ liệu cũ.
-- ============================================================================

-- 1) Cột tổng tiền đã nạp
alter table public.profiles
  add column if not exists total_topup bigint not null default 0;

-- 2) Cấp khởi điểm là 'basic' (giá trị cũ 'dong' — cấp Đồng — đã bỏ)
alter table public.profiles
  alter column member_level set default 'basic';

update public.profiles set member_level = 'basic' where member_level = 'dong';

-- 3) Người đã nạp trước khi có cột này: lấy tổng các giao dịch nạp ĐÃ THANH TOÁN
--    trong bảng payments làm số liệu ban đầu.
update public.profiles p
set total_topup = coalesce((
  select sum(pay.amount)
  from public.payments pay
  where pay.user_id = p.id and pay.kind = 'topup' and pay.status = 'paid'
), 0)
where p.total_topup = 0;
