-- ============================================================================
-- BẢNG GIÁ ĐẤT NHÀ NƯỚC — theo quyết định của UBND tỉnh/thành.
--
-- VÌ SAO ĐÁNG LÀM: đây là con số người mua và người bán đều cần mà không sàn nào
-- đưa sẵn — thuế trước bạ, phí công chứng, thuế thu nhập khi bán đều tính trên
-- giá này. Nó là văn bản pháp quy: công khai, miễn phí, hợp pháp, chi tiết tới
-- từng tuyến đường từng đoạn, và mỗi năm chỉ cập nhật một lần.
--
-- Đặt cạnh giá thị trường tính từ tin đăng, khách thấy ngay "giá Nhà nước 28
-- triệu/m², giá thị trường 86 triệu/m², gấp 3,1 lần" — thông tin thật, không sàn
-- nào ở Miền Trung đang có.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- ============================================================================

create table if not exists public.gia_dat_nha_nuoc (
  id          bigserial primary key,

  -- Địa giới theo HỆ MỚI (sau sáp nhập 2025) để khớp với tin đăng
  tinh        text not null,
  phuong      text not null default '',

  -- Tuyến đường và đoạn. Bảng giá đất chia nhỏ theo đoạn:
  -- "Nguyễn Văn Linh" · đoạn "Từ Trần Phú đến Nguyễn Tri Phương"
  duong       text not null,
  doan        text not null default '',

  -- Vị trí theo cách phân của bảng giá đất: 1 = mặt tiền, 2/3/4 = trong kiệt/hẻm
  vi_tri      smallint not null default 1,

  -- Đồng mỗi m²
  gia_m2      bigint not null,

  -- Căn cứ pháp lý: "Quyết định 47/2024/QĐ-UBND TP Huế"
  can_cu      text not null default '',
  hieu_luc_tu date,

  tao_luc     timestamptz not null default now(),
  unique (tinh, phuong, duong, doan, vi_tri)
);

comment on table public.gia_dat_nha_nuoc is
  'Bảng giá đất do UBND tỉnh ban hành — dùng để đối chiếu với giá thị trường và tính thuế phí.';

create index if not exists gia_dat_tra_cuu
  on public.gia_dat_nha_nuoc (tinh, phuong, duong);

-- ĐỌC: mọi người. Đây là văn bản pháp quy công khai.
alter table public.gia_dat_nha_nuoc enable row level security;

drop policy if exists "gia_dat_doc_tat_ca" on public.gia_dat_nha_nuoc;
create policy "gia_dat_doc_tat_ca"
  on public.gia_dat_nha_nuoc for select
  using (true);

-- GHI: chỉ quản trị viên (nhập từ trang /admin/gia-dat).
drop policy if exists "gia_dat_ghi_admin" on public.gia_dat_nha_nuoc;
create policy "gia_dat_ghi_admin"
  on public.gia_dat_nha_nuoc for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
