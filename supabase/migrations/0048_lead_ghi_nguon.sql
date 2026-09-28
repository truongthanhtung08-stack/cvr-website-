-- ============================================================================
-- 0048 — LEAD GHI NGUỒN: web hay Zalo Mini App (28/09/2026)
-- ----------------------------------------------------------------------------
-- Mini App là MỘT KÊNH của cùng nền tảng: chung tài khoản, chung tin, chung bảng
-- lead. Người đăng xem khách ở /tai-khoan/khach-hang phải biết khách hỏi số từ
-- đâu — giống lượt xem đã có cột nguon (0036).
--   · listing_leads.nguon: 'web' (mặc định, lead cũ) | 'zalo'
--   · reveal_contact thêm tham số p_nguon (không bắt buộc) — web gọi như cũ.
-- ============================================================================
alter table public.listing_leads add column if not exists nguon text not null default 'web';

drop function if exists public.reveal_contact(text);

create or replace function public.reveal_contact(p_listing_id text, p_nguon text default null)
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
    return null;
  end if;

  -- Chủ tin xem số của chính mình → trả số, KHÔNG ghi thành khách.
  if v_chu = v_uid then
    return v_phone;
  end if;

  select full_name, phone into v_name, v_vphone
    from public.profiles where id = v_uid;

  insert into public.listing_leads (listing_id, viewer_id, viewer_name, viewer_phone, nguon)
  select p_listing_id, v_uid, v_name, v_vphone,
         case when p_nguon = 'zalo' then 'zalo' else 'web' end
   where not exists (
     select 1 from public.listing_leads
      where listing_id = p_listing_id
        and viewer_id  = v_uid
        and created_at > now() - interval '1 day'
   );

  return v_phone;
end;
$function$;

grant execute on function public.reveal_contact(text, text) to authenticated;
