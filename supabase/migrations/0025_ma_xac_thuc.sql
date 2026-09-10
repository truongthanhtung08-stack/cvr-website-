-- ============================================================================
-- MÃ XÁC THỰC (OTP) — GỬI QUA EMAIL, DỰ PHÒNG ZALO
--
-- Vì sao tự làm mà không dùng OTP có sẵn của Supabase:
--   · OTP email của Supabase đi bằng máy chủ thư dùng chung, GIỚI HẠN vài email
--     mỗi giờ nếu chưa cắm SMTP riêng — khách đông một chút là nghẽn, người đăng
--     ký không nhận được mã và bỏ đi.
--   · Web đã có sẵn khoá Resend (đang dùng gửi thông báo nạp tiền / duyệt tin),
--     nên tự sinh mã rồi gửi bằng Resend là chạy được NGAY, không phải chờ bật
--     thêm dịch vụ nào.
--   · OTP qua Zalo ZNS hiện chưa gửi được (số dư ZBS = 0đ) → email là đường
--     chính, Zalo là đường dự phòng khi khách không có email.
--
-- BẢO MẬT — những chỗ bắt buộc, đừng lược bớt:
--   · KHÔNG lưu mã dạng chữ thô. Lưu SHA-256 của mã; lộ cả bảng cũng không đọc
--     ngược ra mã được.
--   · Mã sống 10 phút, dùng MỘT LẦN (đánh dấu da_dung).
--   · Đếm số lần nhập sai, quá 5 lần là huỷ mã — chặn dò mã bằng máy.
--   · Bảng KHÔNG cho ai đọc qua API (không có policy select). Chỉ máy chủ dùng
--     khoá service_role mới đụng tới được.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.ma_xac_thuc (
  id          uuid primary key default gen_random_uuid(),
  -- Nơi nhận mã: email hoặc số điện thoại đã chuẩn hoá.
  dinh_danh   text not null,
  kenh        text not null,                     -- 'email' | 'zalo'
  viec        text not null,                     -- 'dang-ky' | 'quen-mat-khau' | 'xac-minh-sdt'
  ma_bam      text not null,                     -- SHA-256 của mã, KHÔNG phải mã thô
  het_han_luc timestamptz not null,
  so_lan_sai  integer not null default 0,
  da_dung     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.ma_xac_thuc is
  'Mã OTP tự sinh, gửi qua email (Resend) hoặc Zalo. Chỉ máy chủ đọc/ghi — không có policy cho người dùng.';

create index if not exists idx_ma_xt_tra_cuu
  on public.ma_xac_thuc (dinh_danh, viec, created_at desc);

-- Bật RLS mà KHÔNG tạo policy nào = khoá cứng với anon/authenticated.
-- service_role bỏ qua RLS nên máy chủ vẫn dùng bình thường.
alter table public.ma_xac_thuc enable row level security;

-- Dọn mã cũ để bảng không phình. Gọi kèm lúc phát hành mã mới, khỏi tốn một suất
-- cron (Vercel Hobby chỉ cho 2 cron và đã dùng hết).
create or replace function public.don_ma_xac_thuc_cu()
returns void
language sql
security definer
set search_path = public as $$
  delete from public.ma_xac_thuc where created_at < now() - interval '1 day';
$$;
