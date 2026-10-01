-- ============================================================================
-- 0053 — MỘT LUẬT HẠN HIỂN THỊ DUY NHẤT, KHÔNG TRƯỜNG HỢP RIÊNG (01/10/2026)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt: mọi tin theo ĐÚNG chính sách gói + khuyến mãi trong "Giá & quy định".
-- Luật (y hệt hàm soNgayHienThi trong src/lib/billing.ts):
--   · Hưởng khuyến mãi (chương trình free đang chạy vào ngày lên sóng, đúng hạng của
--     chương trình, và là thành viên mới — tài khoản chưa quá free.days; tin admin
--     đăng hộ tính như thành viên mới) → đúng free.days.
--   · Còn lại → số ngày của gói đã chọn; không chọn → gói NGẮN NHẤT của hạng đó.
-- Hết số ngày là ngừng hiển thị — VIP hay thường như nhau.
--
-- Gỡ trường hợp riêng của 0043: "hết VIP thì tụt về tin thường tới 25/10"
-- (details.sau_vip_thuong_den). Tin VIP admin nâng giữ đúng hạn gói đã gắn
-- (Diamond 7 ngày → 02/10, Gold/Silver 15 ngày → 10/10), hết là ngừng hiển thị.
-- ============================================================================
create or replace function public.so_ngay_hien_thi(
  p_tier text, p_purpose text, p_owner uuid, p_luc timestamptz, p_so_ngay_chon int
)
returns int
language sql
stable
security definer
set search_path to 'public'
as $$
  with b as (select data from site_content where key = 'billing'),
  f as (select data->'free' fr from b)
  select case
    when p_tier = coalesce((select fr->>'tierId' from f), 'basic')
     and coalesce((select (fr->>'active')::boolean from f), false)
     and (select coalesce(nullif(fr->>'from', ''), '0001-01-01')::date from f) <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
     and (select coalesce(nullif(fr->>'to', ''), '9999-12-31')::date from f) >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
     and (p_owner is null
          or (select p_luc - p.created_at <= make_interval(days => (select (fr->>'days')::int from f))
                from profiles p where p.id = p_owner))
    then (select (fr->>'days')::int from f)
    when coalesce(p_so_ngay_chon, 0) > 0 then p_so_ngay_chon
    else coalesce(
      (select min((t->>'days')::int)
         from b,
              jsonb_array_elements(coalesce(
                b.data->'congBo'->(case when p_purpose in ('thue', 'can-thue') then 'thue' else 'ban' end)->'plans',
                b.data->'plans')) p,
              jsonb_array_elements(p->'terms') t
        where p->>'tierId' = p_tier),
      7)
  end;
$$;

-- ADMIN CŨNG KHÔNG NGOẠI LỆ (chủ dự án chốt 01/10/2026): mọi thay đổi làm tin bắt đầu
-- MỘT KỲ HIỂN THỊ MỚI mà không tự tính hạn thì CSDL tính theo đúng luật trên:
--   · tin mới lên sóng chưa có hạn (form admin, nhập hàng loạt)
--   · tin chưa hiển thị / đã hết hạn được bật lại thành 'approved' (nút trạng thái admin)
--   · đổi hạng hoặc đổi thời hạn gói của tin đang hiển thị (form admin)
-- Kỳ mới tính từ BÂY GIỜ: ngày đăng + mốc lên đầu + hạn đặt lại, như Up tin.
-- Đường đã tự tính hạn (duyệt tin, Up tin) ghi hạn mới khác hạn cũ → không đụng.
create or replace function public.tin_luon_co_han()
returns trigger
language plpgsql
as $$
declare
  v_chon int;
  v_ky_moi boolean;
begin
  if new.status <> 'approved' then return new; end if;

  if tg_op = 'INSERT' then
    v_ky_moi := new.tier_expires_at is null;
  elsif auth.uid() is not null and not public.is_admin() then
    -- KHÁCH tự sửa tin KHÔNG BAO GIỜ được kỳ mới (đổi tier_days là gia hạn miễn phí).
    -- Kỳ mới của khách chỉ đến từ máy chủ: duyệt tin, đăng lại — đều tự ghi hạn.
    v_ky_moi := false;
  else
    v_ky_moi := new.tier_expires_at is not distinct from old.tier_expires_at
      and (old.status <> 'approved'
           or new.tier is distinct from old.tier
           or new.tier_days is distinct from old.tier_days
           or new.tier_expires_at is null);
  end if;
  if not v_ky_moi then return new; end if;

  -- Số ngày đã chọn — chỉ tính khi gói chọn đúng hạng đang lên sóng.
  v_chon := coalesce(
    new.tier_days,
    case when new.details->'plan'->>'tier' = new.tier::text
         then nullif(new.details->'plan'->>'days', '')::int end);

  if tg_op = 'UPDATE' then
    new.published_at := now();
    new.bumped_at := now();
  end if;
  new.tier_expires_at := coalesce(new.published_at, now())
    + make_interval(days => public.so_ngay_hien_thi(
        new.tier::text, new.purpose::text, new.owner_id, coalesce(new.published_at, now()), v_chon));
  return new;
end;
$$;

-- Gỡ dấu "tụt về tin thường sau VIP" — từ nay hết hạn là hết, không trường hợp riêng.
update public.listings
   set details = details - 'sau_vip_thuong_den'
 where details ? 'sau_vip_thuong_den';
