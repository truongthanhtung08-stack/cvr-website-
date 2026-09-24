-- ============================================================================
-- 0039 — CHỦ TIN TỰ BẤM XEM SỐ TIN MÌNH KHÔNG PHẢI "KHÁCH HỎI SỐ"
-- ----------------------------------------------------------------------------
-- Đo 25/09/2026: chủ tin bấm "Hiện số" ở tin của chính mình → reveal_contact ghi
-- một lead mang tên chủ tin → trang Khách hàng hiện chính mình là khách. Sai.
-- Giữ nguyên mọi thứ khác; chỉ bỏ ghi lead khi người bấm là chủ tin.
-- ============================================================================
create or replace function public.reveal_contact(p_listing_id text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid    uuid := auth.uid();
  v_phone  text;
  v_name   text;
  v_vphone text;
  v_chu    uuid;
begin
  if v_uid is null then
    raise exception 'Cần đăng nhập để xem số điện thoại';
  end if;

  select details->'contact'->>'phone', owner_id
    into v_phone, v_chu
    from public.listings
   where id = p_listing_id and status = 'approved';

  if v_phone is null or btrim(v_phone) = '' then
    return null; -- tin chưa có số → không có gì để hiện, cũng không ghi lead
  end if;

  -- Chủ tin xem số của chính mình → trả số, KHÔNG ghi thành khách.
  if v_chu = v_uid then
    return v_phone;
  end if;

  select full_name, phone into v_name, v_vphone
    from public.profiles where id = v_uid;

  insert into public.listing_leads (listing_id, viewer_id, viewer_name, viewer_phone)
  select p_listing_id, v_uid, v_name, v_vphone
   where not exists (
     select 1 from public.listing_leads
      where listing_id = p_listing_id
        and viewer_id  = v_uid
        and created_at > now() - interval '1 day'
   );

  return v_phone;
end;
$function$;
