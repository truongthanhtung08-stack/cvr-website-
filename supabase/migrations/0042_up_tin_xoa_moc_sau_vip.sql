-- ============================================================================
-- 0042 — UP TIN XOÁ LUÔN MỐC "TIN THƯỜNG SAU VIP" (reset từ đầu, 25/09/2026)
-- Chỉ đổi đúng một dòng so với 0041: details bỏ thêm khoá sau_vip_thuong_den.
-- ============================================================================
create or replace function public.up_tin(
  p_listing text,
  p_user    uuid,
  p_tier    text,
  p_so_ngay int,
  p_tien    bigint     -- tổng khách trả (gồm GTGT); 0 = miễn phí / voucher phủ hết
)
returns table (so_du bigint, het_han timestamptz)
language plpgsql
security definer
set search_path = public as $$
declare
  v_tin  record;
  v_du   bigint;
  v_het  timestamptz := now() + make_interval(days => p_so_ngay);
begin
  if p_so_ngay <= 0 or p_tien < 0 then
    raise exception 'Thời hạn hoặc số tiền không hợp lệ';
  end if;

  select id, owner_id, status into v_tin from public.listings where id = p_listing for update;
  if not found then raise exception 'KHONG_CO_TIN'; end if;
  if v_tin.owner_id <> p_user then raise exception 'KHONG_PHAI_CHU'; end if;
  if v_tin.status not in ('approved'::listing_status, 'expired'::listing_status) then
    raise exception 'SAI_TRANG_THAI';
  end if;

  select coalesce(balance, 0)::bigint into v_du from public.profiles where id = p_user for update;
  if p_tien > 0 then
    if v_du < p_tien then raise exception 'VI_KHONG_DU'; end if;
    update public.profiles set balance = coalesce(balance, 0) - p_tien where id = p_user;
    v_du := v_du - p_tien;
  end if;

  update public.listings
     set status          = 'approved',
         tier            = p_tier::listing_tier,
         published_at    = now(),
         bumped_at       = now(),
         tier_expires_at = v_het,
         details         = coalesce(details, '{}'::jsonb) - 'nhac_het_han' - 'sau_vip_thuong_den'
   where id = p_listing;

  return query select v_du, v_het;
end;
$$;
revoke all on function public.up_tin(text, uuid, text, int, bigint) from public, anon, authenticated;
grant execute on function public.up_tin(text, uuid, text, int, bigint) to service_role;
