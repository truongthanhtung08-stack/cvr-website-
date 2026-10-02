-- ============================================================================
-- 0057 — SỔ CHI TRẢ THU NHẬP CHO CÁ NHÂN (nguồn lập tờ khai 05/KK-TNCN và 05/QTT-TNCN)
-- ----------------------------------------------------------------------------
-- Mỗi dòng = MỘT lần công ty trả thu nhập cho một cá nhân (lương một tháng, một
-- lần hoa hồng, một lần thù lao). Admin nhập ở /admin/hoa-don-thue, web tự tính
-- thuế khấu trừ (src/lib/thueTncn.ts) và ghi luôn vào cột thue_khau_tru để số
-- trên tờ khai là số đã thực khấu trừ lúc trả — đổi luật sau này không làm lệch
-- số của kỳ cũ.
--
-- Chạy một lần: Supabase → SQL Editor → dán file này → Run. Chạy lại không hỏng.
-- ============================================================================

create table if not exists public.tncn_chi_tra (
  id             uuid primary key default gen_random_uuid(),
  ngay_tra       date not null,
  ho_ten         text not null,
  -- MST cá nhân hoặc số CCCD (từ 01/7/2025 CCCD dùng thay MST cá nhân)
  ma_so          text,
  loai           text not null check (loai in ('hdld', 'khong_hd', 'khong_cu_tru')),
  dien_giai      text,
  thu_nhap       bigint not null default 0 check (thu_nhap >= 0),
  bao_hiem       bigint not null default 0 check (bao_hiem >= 0),
  so_npt         int    not null default 0 check (so_npt >= 0),
  thue_khau_tru  bigint not null default 0 check (thue_khau_tru >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists idx_tncn_chi_tra_ngay on public.tncn_chi_tra (ngay_tra);

alter table public.tncn_chi_tra enable row level security;
drop policy if exists "tncn_chi_tra_admin" on public.tncn_chi_tra;
create policy "tncn_chi_tra_admin" on public.tncn_chi_tra
  for all using ( public.is_admin() ) with check ( public.is_admin() );
