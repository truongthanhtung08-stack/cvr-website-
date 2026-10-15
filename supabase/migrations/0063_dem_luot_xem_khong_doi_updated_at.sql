-- ============================================================================
-- 0063 — ĐẾM LƯỢT XEM KHÔNG ĐỔI updated_at CỦA TIN (15/10/2026)
-- ----------------------------------------------------------------------------
-- Hoá đơn Vercel kỳ 14/9–14/10: ISR Writes 3,46 triệu lượt ($17,99) + Fast Origin
-- Transfer 50 GB ($13,41). Nguyên nhân: mỗi lượt xem tin, increment_listing_view (0037)
-- cộng view_count → trg_listings_updated_at ghi updated_at = now() → cron
-- /api/tin-dang/het-han (mỗi phút) thấy tin "vừa đổi" → revalidateTag("listings")
-- → xoá bộ nhớ đệm MỌI trang tin gần như mỗi phút → dựng lại liên tục.
--
-- Sửa: lệnh đếm lượt xem (cờ app.dem_luot_xem = 'co', 0037) giữ nguyên updated_at.
-- Mọi thay đổi khác của tin vẫn ghi updated_at như cũ → cron vẫn làm mới đúng lúc.
-- ============================================================================

create or replace function public.listings_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.dem_luot_xem', true), '') = 'co' then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_listings_updated_at on public.listings;
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.listings_set_updated_at();
