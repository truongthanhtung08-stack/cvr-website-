-- ============================================================================
-- NHẬT KÝ VIỆC MÁY TỰ LÀM — ĐỂ BIẾT MÁY CÒN TỰ LÀM HAY ĐÃ CHẾT
-- ----------------------------------------------------------------------------
-- VÌ SAO CÓ BẢNG NÀY: mỗi ngày web tự chạy bốn việc (chụp giá khu vực, quét tin
-- hết hạn gói, canh hạn thuế suất, canh 6 bản ghi tên miền). Vấn đề của mọi thứ
-- "tự động": lúc nó CHẠY TỐT và lúc nó CHẾT HẲN trông giống hệt nhau — đều im
-- lặng. Cron ngừng chạy vì dự án bị tạm dừng, vì đổi khoá CRON_SECRET, vì một
-- lần deploy hỏng… thì không có gì báo, cho tới khi phát hiện tin VIP hết hạn
-- vẫn còn VIP suốt hai tháng.
--
-- Có bảng này thì mở /admin là thấy ngay: lần chạy gần nhất lúc nào, việc nào
-- xong, việc nào hỏng. Quá một ngày không có dòng mới = máy đã ngừng tự làm.
--
-- Việc HỎNG vẫn báo riêng qua sổ sự cố (bảng su_co) — bảng này chỉ là mạch đập.
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

create table if not exists public.nhat_ky_tu_dong (
  id         uuid primary key default gen_random_uuid(),
  chay_luc   timestamptz not null default now(),

  ma         text not null,            -- mã việc: chup-gia-khu-vuc · canh-dns…
  ten        text not null,            -- tên tiếng Việt hiện ở /admin
  ok         boolean not null,         -- false = việc này hỏng, xem bảng su_co
  tom_tat    text not null,            -- "Hạ 3 tin hết hạn, nhắc 5 tin"
  mili_giay  integer                   -- chạy mất bao lâu, để biết việc nào phình
);

comment on table public.nhat_ky_tu_dong is
  'Mạch đập của các việc định kỳ chạy kèm cron /api/hoa-don/nhac-xuat. Không có dòng mới quá 1 ngày = máy đã ngừng tự làm.';

-- Trang /admin luôn xem lần chạy mới nhất trước.
create index if not exists idx_nhat_ky_tu_dong_moi on public.nhat_ky_tu_dong (chay_luc desc);

-- ── DỌN BỚT ────────────────────────────────────────────────────────────────
-- Bốn việc × hai lần/ngày = ~240 dòng/tháng. Nhẹ, nhưng không có lý do giữ mãi:
-- nhật ký quá 90 ngày thì chẳng ai tra nữa. Dọn ngay lúc chạy migration, và
-- lần sau chạy lại migration là dọn tiếp.
delete from public.nhat_ky_tu_dong where chay_luc < now() - interval '90 days';

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Nhật ký lộ nhịp vận hành bên trong → CHỈ admin đọc được.
-- Máy chủ ghi bằng service_role nên không cần policy insert cho người thường.
alter table public.nhat_ky_tu_dong enable row level security;
drop policy if exists "nhat_ky_tu_dong_admin" on public.nhat_ky_tu_dong;
create policy "nhat_ky_tu_dong_admin" on public.nhat_ky_tu_dong
  for all using ( public.is_admin() ) with check ( public.is_admin() );
