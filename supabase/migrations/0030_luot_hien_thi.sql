-- ============================================================================
-- LƯỢT HIỂN THỊ TIN — tin được BÀY RA trước mắt khách bao nhiêu lần
-- ----------------------------------------------------------------------------
-- Trước migration này web chỉ đếm khi khách BẤM MỞ tin (listing_view_daily).
-- Nhưng tin còn xuất hiện ở rất nhiều chỗ mà không ai đếm: trang chủ, danh sách
-- Mua bán / Cho thuê, kết quả tìm kiếm, tin liên quan, trang khu vực, trang dự
-- án. Người bán không biết tin mình được bày ra bao nhiêu lần, và mình cũng
-- không có căn cứ để nói "tin Diamond được bày nhiều gấp 20 lần tin thường".
--
-- BA CON SỐ KỂ MỘT CÂU CHUYỆN:
--   Lượt hiển thị  — tin được bày ra bao nhiêu lần
--   Lượt xem tin   — có bao nhiêu người bấm vào (listing_view_daily)
--   Hỏi số         — có bao nhiêu người thật sự quan tâm (listing_leads)
-- Bày nhiều mà ít bấm → tiêu đề/ảnh chưa tốt. Bấm nhiều mà không ai hỏi số →
-- giá chưa hợp lý. Đó mới là thứ có ích cho người trả tiền.
--
-- SỐ PHẢI THẬT: phía web chỉ gọi khi thẻ tin THỰC SỰ lọt vào màn hình và nằm
-- lại ít nhất 1 giây, mỗi tin đếm đúng MỘT lần mỗi phiên mỗi ngày.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0002_listings.sql (bảng listings) + 0001_profiles.sql (is_admin).
-- ============================================================================

-- 1) BẢNG ĐẾM THEO NGÀY -------------------------------------------------------
-- Mỗi tin mỗi ngày MỘT dòng, giống listing_view_daily — nhẹ hơn ghi từng lượt
-- rất nhiều: 500 tin × 365 ngày vẫn chỉ ~180 nghìn dòng.
create table if not exists public.listing_impression_daily (
  listing_id text not null references public.listings(id) on delete cascade,
  ngay       date not null default current_date,
  luot       integer not null default 0,
  primary key (listing_id, ngay)
);

comment on table public.listing_impression_daily is
  'Lượt HIỂN THỊ tin theo ngày — tin được bày ra trước mắt khách bao nhiêu lần.';

create index if not exists idx_impression_ngay on public.listing_impression_daily (ngay desc);

alter table public.listing_impression_daily enable row level security;

-- Đọc: CHỦ TIN xem tin mình; admin xem tất cả. Người ngoài không thấy gì.
-- (Không có policy INSERT/UPDATE — chỉ hàm bên dưới ghi được.)
drop policy if exists "impression_select_owner_or_admin" on public.listing_impression_daily;
create policy "impression_select_owner_or_admin" on public.listing_impression_daily
  for select using (
    public.is_admin() or exists (
      select 1 from public.listings l
      where l.id = listing_impression_daily.listing_id and l.owner_id = auth.uid()
    )
  );

-- 2) GHI LƯỢT HIỂN THỊ --------------------------------------------------------
-- Nhận MỘT LẦN cả nắm tin vừa hiện trên màn hình — khách cuộn hết một trang danh
-- sách là hơn chục tin, bắn từng cái một thì vừa nặng máy chủ vừa tốn hạn mức.
--
-- CHỈ đếm cho tin ĐÃ DUYỆT, và cắt tối đa 60 mã mỗi lần gọi: người lạ có gọi
-- thẳng hàm này cũng không thổi số lên được bao nhiêu.
create or replace function public.ghi_hien_thi(p_ids text[])
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if p_ids is null or array_length(p_ids, 1) is null then
    return;
  end if;

  insert into public.listing_impression_daily (listing_id, ngay, luot)
  select l.id, current_date, 1
    from public.listings l
   where l.id = any (p_ids[1:60])
     and l.status = 'approved'
  on conflict (listing_id, ngay)
  do update set luot = public.listing_impression_daily.luot + 1;
end;
$$;

comment on function public.ghi_hien_thi(text[]) is
  'Cộng lượt hiển thị cho một nắm tin vừa hiện trên màn hình khách.';

-- Khách vãng lai cũng phải đếm được — người mua không cần đăng nhập.
grant execute on function public.ghi_hien_thi(text[]) to anon, authenticated;
