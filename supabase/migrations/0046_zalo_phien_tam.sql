-- ============================================================================
-- 0046 — PHIÊN ĐĂNG NHẬP ZALO TẠM (chạm là vào trên điện thoại, 25/09/2026)
-- ----------------------------------------------------------------------------
-- Trên điện thoại, khách bấm "Đăng nhập qua ứng dụng Zalo" → máy chuyển sang
-- APP ZALO → Zalo trả về web có thể bằng MỘT TRÌNH DUYỆT KHÁC (trình duyệt trong
-- Zalo / trình duyệt mặc định). Cookie cất ở trình duyệt ban đầu không đi theo →
-- báo "sai phiên", khách không vào được. Nên cất mã phiên (PKCE verifier + nơi
-- quay về) ở MÁY CHỦ theo `state` (chuỗi ngẫu nhiên 32 byte Zalo trả lại nguyên).
-- Dùng MỘT LẦN, hạn 30 phút. Chỉ máy chủ (service role) đọc/ghi.
-- ============================================================================
create table if not exists public.zalo_phien_tam (
  state     text primary key,
  verifier  text not null,
  tiep      text not null default '/tai-khoan',
  tao_luc   timestamptz not null default now()
);
alter table public.zalo_phien_tam enable row level security;
revoke all on public.zalo_phien_tam from anon, authenticated;
grant all on public.zalo_phien_tam to service_role;
