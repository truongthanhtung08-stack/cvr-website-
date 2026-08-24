-- ============================================================================
-- BÁN GÓI TIN + GHI NHẬN DOANH THU & THUẾ GTGT
-- ----------------------------------------------------------------------------
-- Quy trình chủ dự án chốt (24/08/2026):
--   Khách nạp tiền → vào ví, hiện số dư          (ĐÃ CÓ, không đụng)
--   Khách chọn gói → đăng tin → CHỜ DUYỆT        (chưa trừ đồng nào)
--   Admin duyệt    → TRỪ VÍ + ghi doanh thu + xuất hóa đơn điện tử cho khách
--   Tin bị từ chối → không trừ tiền, không có hóa đơn
--
-- Giá KHÔNG lưu cứng ở đây — luôn lấy từ bộ gói trong lib/billing.ts (admin sửa
-- ở /admin/gia-khuyen-mai). Bảng này chỉ lưu SỐ ĐÃ CHỐT tại thời điểm duyệt,
-- để sau này đổi bảng giá thì hóa đơn cũ vẫn giữ nguyên con số lúc bán.
--
-- Giá niêm yết CHƯA gồm VAT — khách trả giá + 8% (Nghị quyết 204/2025/QH15,
-- áp dụng đến hết 31/12/2026). Thuế suất lưu kèm từng giao dịch để sang 2027
-- đổi sang 10% thì số liệu cũ không bị tính lại sai.
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

-- ── 1) CỘT MỚI TRÊN listings ───────────────────────────────────────────────
-- Khách ĐƯỢC sửa 2 cột đầu (đó là nguyện vọng chọn gói, chưa phải tiền).
-- Cột tiền thì chỉ máy chủ/admin ghi — trigger ở mục 2 chặn khách.
alter table public.listings
  add column if not exists tier_yeu_cau  public.listing_tier,  -- gói khách CHỌN khi đăng
  add column if not exists tier_days     int,                  -- kỳ hạn khách chọn (7/15/30)
  add column if not exists gia_chua_thue bigint,               -- tiền hàng đã chốt lúc duyệt
  add column if not exists tien_thue     bigint,               -- thuế GTGT đầu ra
  add column if not exists thue_suat     numeric(4,3),         -- 0.080 — lưu kèm để đối chiếu
  add column if not exists da_tru_vi     boolean not null default false; -- chống trừ tiền 2 lần

comment on column public.listings.tier_yeu_cau is 'Gói khách chọn lúc đăng. Gói THẬT nằm ở cột tier, chỉ admin đặt khi duyệt.';
comment on column public.listings.da_tru_vi   is 'Đã trừ ví cho tin này chưa — chặn duyệt lại lần 2 bị trừ tiền lần nữa.';

-- ── 2) CHẶN KHÁCH TỰ SỬA CỘT TIỀN ──────────────────────────────────────────
-- Giữ nguyên toàn bộ luật cũ của 0007, chỉ THÊM 4 cột tiền vào danh sách cấm.
create or replace function public.protect_listing_privileged()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service_role / SQL Editor / admin → cho phép
  end if;

  -- Cột đặc quyền tuyệt đối: người thường không bao giờ được đổi
  if new.tier            is distinct from old.tier
     or new.tier_expires_at is distinct from old.tier_expires_at
     or new.published_at is distinct from old.published_at
     or new.view_count   is distinct from old.view_count
     or new.owner_id     is distinct from old.owner_id
     -- MỚI: bốn cột tiền — nếu không chặn, khách sửa gia_chua_thue = 0 là đăng VIP miễn phí
     or new.gia_chua_thue is distinct from old.gia_chua_thue
     or new.tien_thue    is distinct from old.tien_thue
     or new.thue_suat    is distinct from old.thue_suat
     or new.da_tru_vi    is distinct from old.da_tru_vi then
    raise exception 'Không được sửa cột đặc quyền của tin (tier/published_at/view_count/owner/tiền)';
  end if;

  -- Status: chủ tin chỉ được chuyển sang draft / pending / hidden
  -- (đăng tin = pending chờ duyệt; không bao giờ tự approve)
  if new.status is distinct from old.status
     and new.status not in ('draft', 'pending', 'hidden') then
    raise exception 'Trạng thái không hợp lệ — tin phải chờ Coastal Land kiểm duyệt';
  end if;

  return new;
end;
$$;

-- ── 2B) KHÁCH KHAI THÔNG TIN XUẤT HÓA ĐƠN (khai MỘT LẦN, dùng mãi) ─────────
-- Đa số khách là môi giới cá nhân, không cần hóa đơn → gom vào hóa đơn tổng
-- cuối ngày. Ai cần hóa đơn công ty thì bật cờ này và khai một lần ở trang tài
-- khoản; từ đó mọi giao dịch của họ tự xuất hóa đơn riêng, không phải khai lại.
alter table public.profiles
  add column if not exists xuat_hoa_don   boolean not null default false,
  add column if not exists hd_ten_cong_ty text,
  add column if not exists hd_mst         text,
  add column if not exists hd_dia_chi     text,
  add column if not exists hd_email       text;   -- để trống → dùng email đăng nhập

comment on column public.profiles.xuat_hoa_don is 'true = khách cần hóa đơn công ty riêng cho từng giao dịch. false = gom vào hóa đơn tổng cuối ngày.';

-- ── 3) SỔ DOANH THU — nguồn duy nhất để lập tờ khai thuế ───────────────────
-- KHÁC với bảng payments: payments ghi TIỀN VÀO (nạp ví — chưa phải doanh thu),
-- bảng này ghi DOANH THU THẬT (khách đã dùng dịch vụ). Đây mới là số đưa vào
-- tờ khai GTGT và tính thuế TNDN.
create table if not exists public.doanh_thu (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,
  -- ⚠️ listings.id là TEXT (không phải uuid) — tin mẫu giữ id cũ '1'..'33' để URL
  --    /bat-dong-san/[id] và ảnh /images/tin/N.jpg không đổi. Khai uuid ở đây sẽ
  --    lỗi "foreign key constraint cannot be implemented".
  listing_id    text references public.listings(id) on delete set null,

  mo_ta         text   not null,              -- "Gói CVR Diamond 15 ngày — tin #1234"
  tien_hang     bigint not null,              -- doanh thu chưa thuế
  tien_thue     bigint not null,              -- thuế GTGT đầu ra
  thue_suat     numeric(4,3) not null,        -- 0.080
  tong_tra      bigint not null,              -- tiền hàng + thuế = số đã trừ ví
  ngay_ghi_nhan timestamptz not null default now(),

  -- Khách CÓ yêu cầu hóa đơn công ty không? Chốt tại thời điểm giao dịch — khách
  -- sửa hồ sơ sau này cũng không làm sai lệch hóa đơn đã xuất.
  --   true  → xuất hóa đơn RIÊNG ngay khi tin được duyệt, gửi mail/Zalo cho khách
  --   false → gom vào HÓA ĐƠN TỔNG cuối ngày (NĐ 123/2020 Điều 9 khoản 4)
  -- Dù chọn cách nào thì DOANH THU VẪN GHI NHẬN ĐỦ 100% — khách không lấy hóa đơn
  -- không có nghĩa là được miễn kê khai.
  yeu_cau_hoa_don boolean not null default false,
  hoa_don_loai    text not null default 'tong'
    check (hoa_don_loai in ('rieng', 'tong')),

  ten_nguoi_mua   text,
  mst_nguoi_mua   text,
  dia_chi_nguoi_mua text,
  email_nguoi_mua text,

  -- Kết quả phát hành hóa đơn điện tử (điền khi đã nối API MISA/Viettel/VNPT)
  hoa_don_so       text,
  hoa_don_ngay     timestamptz,
  hoa_don_trang_thai text not null default 'chua_xuat'
    check (hoa_don_trang_thai in ('chua_xuat', 'da_xuat', 'loi', 'da_huy')),
  hoa_don_ghi_chu  text,

  created_at    timestamptz not null default now()
);

comment on table public.doanh_thu is 'Sổ doanh thu đã ghi nhận (khách dùng gói). Nguồn lập tờ khai GTGT + TNDN theo quý.';

-- Lọc theo quý khi lập báo cáo
create index if not exists idx_doanh_thu_ngay    on public.doanh_thu (ngay_ghi_nhan);
create index if not exists idx_doanh_thu_user    on public.doanh_thu (user_id);
create index if not exists idx_doanh_thu_hoa_don on public.doanh_thu (hoa_don_trang_thai);
-- Mỗi tin chỉ được ghi nhận doanh thu MỘT lần
create unique index if not exists uq_doanh_thu_listing
  on public.doanh_thu (listing_id) where listing_id is not null;
-- Tác vụ cuối ngày: tìm nhanh các giao dịch chờ gom vào hóa đơn tổng
create index if not exists idx_doanh_thu_cho_gom
  on public.doanh_thu (ngay_ghi_nhan)
  where hoa_don_loai = 'tong' and hoa_don_trang_thai = 'chua_xuat';

-- ── 4) RLS ─────────────────────────────────────────────────────────────────
alter table public.doanh_thu enable row level security;

drop policy if exists "doanh_thu_select_self_or_admin" on public.doanh_thu;
create policy "doanh_thu_select_self_or_admin" on public.doanh_thu
  for select using ( user_id = auth.uid() or public.is_admin() );

-- Ghi/sửa/xoá: CHỈ máy chủ (service_role, auth.uid() null) hoặc admin.
-- Không có policy insert cho người thường → khách không tự tạo được bản ghi doanh thu.
drop policy if exists "doanh_thu_write_admin" on public.doanh_thu;
create policy "doanh_thu_write_admin" on public.doanh_thu
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- ── 5) HÓA ĐƠN MUA VÀO — nhập tay, để tính thuế GTGT được khấu trừ ─────────
-- Hóa đơn anh NHẬN khi mua hàng/dịch vụ (thuê văn phòng, thiết bị, tên miền...).
-- Web không tự biết mấy khoản này nên phải nhập ở /admin.
-- LƯU Ý: hóa đơn nước ngoài (Vercel/Supabase/Anthropic) KHÔNG có thuế GTGT Việt Nam
--        → ghi tien_thue = 0, chỉ tính vào chi phí thuế TNDN, không khấu trừ GTGT.
create table if not exists public.hoa_don_vao (
  id           uuid primary key default gen_random_uuid(),
  ngay_hoa_don date   not null,
  so_hoa_don   text,
  nha_cung_cap text   not null,
  mst          text,
  dien_giai    text,
  tien_hang    bigint not null default 0,
  tien_thue    bigint not null default 0,       -- 0 nếu hóa đơn nước ngoài
  duoc_khau_tru boolean not null default true,  -- false = chỉ tính chi phí TNDN
  ghi_chu      text,
  created_at   timestamptz not null default now()
);

comment on table public.hoa_don_vao is 'Hóa đơn mua vào nhập tay — dùng tính thuế GTGT đầu vào được khấu trừ.';
create index if not exists idx_hoa_don_vao_ngay on public.hoa_don_vao (ngay_hoa_don);

alter table public.hoa_don_vao enable row level security;
drop policy if exists "hoa_don_vao_admin" on public.hoa_don_vao;
create policy "hoa_don_vao_admin" on public.hoa_don_vao
  for all using ( public.is_admin() ) with check ( public.is_admin() );
