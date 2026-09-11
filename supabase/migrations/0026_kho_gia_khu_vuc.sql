-- ============================================================================
-- KHO GIÁ KHU VỰC THEO THÁNG — nền móng dữ liệu lớn của Coastal Land.
--
-- VÌ SAO PHẢI CÓ: giá khu vực hiện đang tính từ các tin ĐANG ĐĂNG. Tin hết hạn
-- hay bị xoá là mất luôn dấu vết, nên web không bao giờ tự vẽ được xu hướng —
-- phải đi mượn số của Batdongsan, CBRE, Savills… và nhập tay từng quý.
--
-- Bảng này chụp ảnh mặt bằng giá MỖI THÁNG MỘT LẦN rồi giữ lại vĩnh viễn. Sau
-- 4–8 quý là đủ dữ liệu để web tự vẽ đường giá của chính mình, tới tận cấp
-- phường — thứ mà không sàn nào ở Miền Trung có. Lúc đó số mượn bên ngoài chỉ
-- còn để đối chiếu.
--
-- Nhẹ: mỗi tháng vài trăm dòng (tỉnh × phường × loại hình có tin). 10 năm cũng
-- chỉ vài chục nghìn dòng.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- ============================================================================

create table if not exists public.gia_khu_vuc_thang (
  -- Mốc thời gian: ngày đầu tháng, VD 2026-09-01
  thang        date    not null,
  tinh         text    not null,
  -- Rỗng = số liệu gộp cả tỉnh (không chia theo phường)
  phuong       text    not null default '',
  loai_hinh    text    not null,
  -- 'ban' hoặc 'thue'
  muc_dich     text    not null default 'ban',

  -- Đồng mỗi m²
  trung_vi     bigint  not null,
  thap         bigint  not null,
  cao          bigint  not null,
  -- Số tin dùng để tính — LUÔN phải lưu, vì con số tính từ 3 tin khác hẳn tính
  -- từ 300 tin. Không có số mẫu thì không biết tin được tới đâu.
  so_mau       integer not null,

  tao_luc      timestamptz not null default now(),
  primary key (thang, tinh, phuong, loai_hinh, muc_dich)
);

comment on table public.gia_khu_vuc_thang is
  'Ảnh chụp mặt bằng giá mỗi m² theo tháng — nền dữ liệu để tự vẽ xu hướng giá.';

create index if not exists gia_khu_vuc_thang_tra_cuu
  on public.gia_khu_vuc_thang (tinh, phuong, loai_hinh, muc_dich, thang desc);

-- AI ĐƯỢC ĐỌC: mọi người. Đây là số liệu thị trường tổng hợp, không có thông tin
-- cá nhân, và chính là thứ web đem ra khoe với người mua.
alter table public.gia_khu_vuc_thang enable row level security;

drop policy if exists "gia_khu_vuc_doc_tat_ca" on public.gia_khu_vuc_thang;
create policy "gia_khu_vuc_doc_tat_ca"
  on public.gia_khu_vuc_thang for select
  using (true);

-- GHI: chỉ máy chủ (service role) — chạy trong việc định kỳ hằng ngày.
drop policy if exists "gia_khu_vuc_ghi_may_chu" on public.gia_khu_vuc_thang;
create policy "gia_khu_vuc_ghi_may_chu"
  on public.gia_khu_vuc_thang for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
