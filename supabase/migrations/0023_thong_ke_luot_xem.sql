-- ============================================================================
-- THỐNG KÊ LƯỢT XEM THEO NGÀY — để khách tự xem "tin của tôi hôm nay bao nhiêu
-- lượt", chứ không chỉ thấy MỘT con số tổng cộng dồn từ đầu.
--
-- Trước migration này chỉ có listings.view_count (một số tổng). Khách không biết
-- tin đang lên hay đang nguội, đẩy tin có ăn thua gì không → không có căn cứ để
-- bỏ tiền mua VIP/đẩy tin.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0002_listings.sql (bảng listings) + 0022_tuong_tac_tin.sql (hàm đếm lượt xem).
-- ============================================================================

-- 1) BẢNG LƯỢT XEM THEO NGÀY -------------------------------------------------
-- Mỗi tin mỗi ngày MỘT dòng (khoá chính kép) — nhẹ hơn ghi từng lượt xem một
-- dòng rất nhiều: 500 tin × 365 ngày vẫn chỉ ~180 nghìn dòng.
create table if not exists public.listing_view_daily (
  listing_id text not null references public.listings(id) on delete cascade,
  ngay       date not null default current_date,
  luot       integer not null default 0,
  primary key (listing_id, ngay)
);

comment on table public.listing_view_daily is
  'Lượt xem tin theo từng ngày — nguồn cho biểu đồ thống kê trong trang tài khoản của khách.';

create index if not exists idx_view_daily_ngay on public.listing_view_daily (ngay desc);

alter table public.listing_view_daily enable row level security;

-- Đọc: CHỦ TIN xem thống kê tin mình; admin xem tất cả. Người ngoài không thấy.
-- (Không có policy INSERT/UPDATE — chỉ hàm increment_listing_view bên dưới ghi được.)
drop policy if exists "view_daily_select_owner_or_admin" on public.listing_view_daily;
create policy "view_daily_select_owner_or_admin" on public.listing_view_daily
  for select using (
    public.is_admin() or exists (
      select 1 from public.listings l
      where l.id = listing_view_daily.listing_id and l.owner_id = auth.uid()
    )
  );

-- 2) ĐẾM LƯỢT XEM — GHI CẢ TỔNG LẪN THEO NGÀY --------------------------------
-- Thay hàm cũ của 0022: vẫn cộng listings.view_count như trước (không phá chỗ
-- nào đang đọc cột đó), đồng thời cộng thêm vào dòng của NGÀY HÔM NAY.
create or replace function public.increment_listing_view(p_listing_id text)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_ok boolean;
begin
  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id and status = 'approved'
  returning true into v_ok;

  -- Tin chưa duyệt / không tồn tại thì thôi, không ghi thống kê rác.
  if v_ok is null then
    return;
  end if;

  insert into public.listing_view_daily as d (listing_id, ngay, luot)
  values (p_listing_id, current_date, 1)
  on conflict (listing_id, ngay) do update set luot = d.luot + 1;
end;
$$;

grant execute on function public.increment_listing_view(text) to anon, authenticated;
