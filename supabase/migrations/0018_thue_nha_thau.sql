-- ============================================================================
-- HÓA ĐƠN NƯỚC NGOÀI + THUẾ NHÀ THẦU (FCT)
-- ----------------------------------------------------------------------------
-- Mua dịch vụ nước ngoài (Anthropic, Vercel, Supabase…) thì bên Việt Nam phải
-- KHAI VÀ NỘP THUẾ THAY nhà cung cấp. Nộp xong, chứng từ nộp thuế GTGT đó là
-- thuế đầu vào ĐƯỢC KHẤU TRỪ của công ty → cộng thẳng vào chỉ tiêu [24] và [25]
-- của tờ khai 01/GTGT. Không khai thì vừa mất khoản khấu trừ, vừa bị phạt.
--
-- Căn cứ (tra 28/08/2026) — công thức và tỷ lệ đặt ở src/lib/thueNhaThau.ts:
--   · Tỷ lệ % thuế GTGT trên doanh thu — Thông tư 69/2025/TT-BTC (dịch vụ 5%)
--   · Tỷ lệ % thuế TNDN trên doanh thu — Nghị định 320/2025/NĐ-CP (dịch vụ 5%,
--     bản quyền 10%)
--   · Khấu trừ thuế GTGT nộp thay — Nghị định 181/2025/NĐ-CP
--   · Quy đổi ngược khi hợp đồng NET — Thông tư 20/2026/TT-BTC
--
-- SỐ TIỀN THUẾ LƯU CỨNG TỪNG DÒNG, không tính lại lúc đọc: tỷ lệ % có thể đổi
-- theo năm, hóa đơn cũ phải giữ nguyên con số đã thực nộp Kho bạc.
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

create table if not exists public.hoa_don_ngoai (
  id            uuid primary key default gen_random_uuid(),

  -- Kỳ khai 01/NTNN — luôn là NGÀY 1 của tháng phát sinh. Hạn nộp: ngày 20 tháng sau.
  ky_thang      date    not null,
  ngay_hoa_don  date    not null,
  nha_cung_cap  text    not null,
  so_hoa_don    text,
  dien_giai     text,

  -- 'da_dang_ky'     = đã đăng ký thuế tại VN (MST đầu 80) → KHÔNG khai thay,
  --                    toàn bộ tiền là chi phí TNDN, không có gì để khấu trừ.
  -- 'phai_khai_thay' = chưa đăng ký → bắt buộc khai nộp thay.
  nhom          text    not null default 'phai_khai_thay'
                        check (nhom in ('da_dang_ky', 'phai_khai_thay')),

  -- 'dich_vu'  = hosting, API, lưu trữ… → GTGT 5% · TNDN 5%
  -- 'ban_quyen'= license phần mềm       → GTGT 0% · TNDN 10%
  loai          text    not null default 'dich_vu'
                        check (loai in ('dich_vu', 'ban_quyen')),

  -- true = hợp đồng NET (trả thẻ, nhà cung cấp nhận đủ, mình chịu thuế) → quy đổi ngược.
  hop_dong_net  boolean not null default true,

  tien_usd      numeric(14,2) not null default 0,
  ty_gia        numeric(14,2) not null default 0,
  tien_vnd      bigint  not null default 0,   -- = round(tien_usd * ty_gia)

  dt_gtgt       bigint  not null default 0,   -- doanh thu tính thuế GTGT
  thue_gtgt     bigint  not null default 0,   -- 👉 vào chỉ tiêu [24] và [25]
  dt_tndn       bigint  not null default 0,   -- doanh thu tính thuế TNDN
  thue_tndn     bigint  not null default 0,   -- chi phí công ty, không khấu trừ

  -- Chỉ khi ĐÃ NỘP Kho bạc mới được khấu trừ (Nghị định 181/2025 đòi chứng từ nộp).
  da_nop        boolean not null default false,
  ngay_nop      date,
  chung_tu_nop  text,

  ghi_chu       text,
  created_at    timestamptz not null default now()
);

comment on table public.hoa_don_ngoai is
  'Hóa đơn nhà cung cấp nước ngoài + thuế nhà thầu nộp thay. Thuế GTGT đã nộp được khấu trừ vào 01/GTGT.';

create index if not exists idx_hoa_don_ngoai_ky   on public.hoa_don_ngoai (ky_thang);
create index if not exists idx_hoa_don_ngoai_ngay on public.hoa_don_ngoai (ngay_hoa_don);

-- Chống nhập trùng khi tải lại cùng một hóa đơn: cùng nhà cung cấp + cùng số hóa đơn.
create unique index if not exists uq_hoa_don_ngoai_so
  on public.hoa_don_ngoai (lower(nha_cung_cap), so_hoa_don)
  where so_hoa_don is not null;

alter table public.hoa_don_ngoai enable row level security;
drop policy if exists "hoa_don_ngoai_admin" on public.hoa_don_ngoai;
create policy "hoa_don_ngoai_admin" on public.hoa_don_ngoai
  for all using ( public.is_admin() ) with check ( public.is_admin() );
