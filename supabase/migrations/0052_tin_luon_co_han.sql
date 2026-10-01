-- ============================================================================
-- 0052 — MỌI TIN ĐANG HIỂN THỊ ĐỀU CÓ NGÀY KẾT THÚC, LẤY TỪ MỘT NGUỒN DUY NHẤT (01/10/2026)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt 01/10/2026:
--   · Hạn hiển thị theo ĐÚNG chính sách giá / gói VIP đặt trong admin "Giá & quy định"
--     (site_content key 'billing') — MỘT NGUỒN DUY NHẤT, không ghi cứng số ngày ở đâu khác.
--   · Thành viên mới: tin thường ĐÚNG số ngày của chương trình (free.days, đang 30); tin
--     admin đăng hộ cũng vậy. VIP theo gói đã mua. Tin mới hiện trên tin cũ (bumped_at).
-- Rà 01/10 thấy 47 tin không có ngày kết thúc (hiện vô thời hạn) vì 3 đường lên sóng không
-- ghi hạn: duyệt tin thường miễn phí, admin đăng bằng form, admin nhập hàng loạt. Luật ở
-- CSDL để KHÔNG đường nào (kể cả sau này) sót: tin chuyển sang 'approved' mà chưa có hạn →
--   · tin thường: ngày đăng + free.days
--   · VIP: ngày đăng + gói NGẮN NHẤT của hạng đó (bảng công bố theo mục đích Bán / Cho thuê)
-- Đường duyệt có gói đã mua thì tự ghi hạn trước — luật này chỉ lấp chỗ trống.
-- ============================================================================
create or replace function public.so_ngay_hien_mac_dinh(p_tier text, p_purpose text)
returns int
language sql
stable
security definer
set search_path to 'public'
as $$
  select case
    when p_tier = 'basic' then
      coalesce((select (data->'free'->>'days')::int from site_content where key = 'billing'), 30)
    else coalesce(
      (select min((t->>'days')::int)
         from site_content s,
              jsonb_array_elements(coalesce(
                s.data->'congBo'->(case when p_purpose in ('thue', 'can-thue') then 'thue' else 'ban' end)->'plans',
                s.data->'plans')) p,
              jsonb_array_elements(p->'terms') t
        where s.key = 'billing' and p->>'tierId' = p_tier),
      7)
  end;
$$;

create or replace function public.tin_luon_co_han()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'approved' and new.tier_expires_at is null then
    new.tier_expires_at := coalesce(new.published_at, now())
      + make_interval(days => public.so_ngay_hien_mac_dinh(new.tier::text, new.purpose::text));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tin_luon_co_han on public.listings;
create trigger trg_tin_luon_co_han
  before insert or update on public.listings
  for each row execute function public.tin_luon_co_han();

-- Lấp hạn cho các tin đang hiển thị mà chưa có (47 tin thường đo ngày 01/10/2026 — đã lấp
-- = ngày đăng + 30 ngày, trùng với free.days hiện tại).
update public.listings
   set tier_expires_at = coalesce(published_at, created_at)
       + make_interval(days => public.so_ngay_hien_mac_dinh(tier::text, purpose::text))
 where status = 'approved' and tier_expires_at is null;
