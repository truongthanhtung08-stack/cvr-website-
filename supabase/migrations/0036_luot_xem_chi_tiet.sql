-- ============================================================================
-- 0036 — TỪNG LƯỢT XEM TIN CÓ GIỜ + KHÔNG ĐẾM LƯỢT XEM CỦA CHÍNH CHỦ TIN
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt 24/09/2026: người đăng tin phải nắm rõ tin có bao nhiêu lượt
-- xem, NGÀY GIỜ từng lượt xem — kể cả người xem không đăng nhập. Người xem ẩn
-- danh KHÔNG có danh tính (không kỹ thuật nào lấy được tên/SĐT khi họ không
-- đăng nhập / nhập OTP), nên bảng này chỉ ghi: lúc nào · thiết bị · đến từ đâu ·
-- có phải thành viên đã đăng nhập hay không. Danh tính thành viên vẫn nằm ở
-- listing_viewer (0031) và listing_leads (0022) như cũ.
--
-- Sửa lỗi: increment_listing_view trước đây cộng cả lượt CHÍNH CHỦ TIN tự mở
-- tin mình ra xem → số lượt xem bị thổi lên. Nay bỏ qua lượt đó (ghi_nguoi_xem
-- ở 0031 đã loại chủ tin từ trước, chỉ còn con số này là lệch).
--
-- ⚠️ Từ 30/10/2026 Supabase không tự mở Data API cho bảng MỚI → GRANT ở cuối file.
-- ============================================================================

create table if not exists public.listing_view_event (
  id             bigserial primary key,
  listing_id     text not null references public.listings(id) on delete cascade,
  luc            timestamptz not null default now(),
  thiet_bi       text,                        -- 'dien_thoai' | 'may_tinh'
  nguon          text,                        -- 'google' | 'zalo' | 'facebook' | 'khac' | 'truc_tiep' | 'trong_web'
  la_thanh_vien  boolean not null default false
);

comment on table public.listing_view_event is
  'Từng lượt mở tin ra xem (kể cả ẩn danh) — chỉ thời điểm, thiết bị, nguồn; KHÔNG có danh tính.';

create index if not exists idx_view_event_listing on public.listing_view_event (listing_id, luc desc);

alter table public.listing_view_event enable row level security;

-- Chỉ CHỦ TIN và admin đọc được lượt xem của tin. Không ai ghi thẳng được —
-- chỉ hàm increment_listing_view bên dưới ghi.
drop policy if exists "view_event_select_owner_or_admin" on public.listing_view_event;
create policy "view_event_select_owner_or_admin" on public.listing_view_event
  for select using (
    public.is_admin() or exists (
      select 1 from public.listings l
      where l.id = listing_view_event.listing_id and l.owner_id = auth.uid()
    )
  );

-- Hàm cũ chỉ có 1 tham số. Thay bằng hàm 3 tham số có mặc định → trang web đang
-- chạy bản cũ (chỉ gửi p_listing_id) vẫn gọi được, không lỗi giữa lúc chuyển.
drop function if exists public.increment_listing_view(text);

create or replace function public.increment_listing_view(
  p_listing_id text,
  p_thiet_bi   text default null,
  p_nguon      text default null
)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_chu uuid;
  v_uid uuid := auth.uid();
begin
  select l.owner_id into v_chu
    from public.listings l
   where l.id = p_listing_id and l.status = 'approved';

  -- Tin chưa duyệt / không tồn tại → không ghi thống kê rác.
  if not found then
    return;
  end if;

  -- CHÍNH CHỦ TIN tự xem tin mình → KHÔNG tính là lượt xem.
  if v_uid is not null and v_uid = v_chu then
    return;
  end if;

  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id;

  insert into public.listing_view_daily as d (listing_id, ngay, luot)
  values (p_listing_id, current_date, 1)
  on conflict (listing_id, ngay) do update set luot = d.luot + 1;

  insert into public.listing_view_event (listing_id, thiet_bi, nguon, la_thanh_vien)
  values (
    p_listing_id,
    case when p_thiet_bi in ('dien_thoai', 'may_tinh') then p_thiet_bi end,
    case when p_nguon in ('google', 'zalo', 'facebook', 'khac', 'truc_tiep', 'trong_web') then p_nguon end,
    v_uid is not null
  );
end;
$$;

comment on function public.increment_listing_view(text, text, text) is
  'Cộng 1 lượt xem tin (bỏ qua chủ tin) + ghi lượt xem có giờ vào listing_view_event.';

grant execute on function public.increment_listing_view(text, text, text) to anon, authenticated;

-- Quyền Data API cho bảng mới (bắt buộc từ 30/10/2026). Khách lạ KHÔNG đọc được.
grant select on public.listing_view_event to authenticated;
grant select, insert, update, delete on public.listing_view_event to service_role;
grant usage, select on sequence public.listing_view_event_id_seq to service_role;
