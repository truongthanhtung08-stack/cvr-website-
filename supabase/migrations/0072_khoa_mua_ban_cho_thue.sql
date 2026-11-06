-- ============================================================================
-- 0072 — TIN ĐÃ DUYỆT: KHÁCH KHÔNG ĐỔI ĐƯỢC MUA BÁN ↔ CHO THUÊ (chủ dự án 06/11/2026: "giá gói tin khác nhau")
-- Bảng giá theo mục đích: ban + mua = Mua bán · thue + can-thue = Cho thuê (mucDichGia — src/lib/billing.ts).
-- Tin đã từng lên web (có ngày đăng hoặc hạn): khách đổi trong cùng bảng giá được, đổi sang bảng kia thì chặn.
-- Loại hình, địa chỉ vẫn sửa được (0070). Admin không bị chặn. Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================
create or replace function public.giu_mua_ban_cho_thue()
returns trigger
language plpgsql
as $$
begin
  if (old.published_at is not null or old.tier_expires_at is not null)
     and (case when old.purpose::text in ('thue', 'can-thue') then 'thue' else 'ban' end)
         is distinct from (case when new.purpose::text in ('thue', 'can-thue') then 'thue' else 'ban' end)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Tin đã duyệt không đổi được Mua bán / Cho thuê — vui lòng đăng tin mới.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_giu_mua_ban_cho_thue on public.listings;
create trigger trg_giu_mua_ban_cho_thue
  before update of purpose on public.listings
  for each row execute function public.giu_mua_ban_cho_thue();
