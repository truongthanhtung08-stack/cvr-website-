-- ============================================================================
-- 0054 — SỬA TIN ĐANG HIỂN THỊ: HIỆN NGAY, ADMIN KIỂM SAU · SỐ NGÀY CHỈ THEO BẢNG GIÁ
-- (chuẩn Batdongsan, chủ dự án chốt 01/10/2026)
-- ----------------------------------------------------------------------------
-- 1) Khách sửa tin ĐANG HIỂN THỊ: tin KHÔNG bị ẩn, gói / ngày đăng / hạn giữ nguyên.
--    CSDL tự ghi details.da_sua_luc → admin thấy trong "Đã sửa — chờ kiểm", kiểm xong
--    bấm "Đã kiểm" (xoá dấu), vi phạm thì ẩn / từ chối. Khách KHÔNG xoá được dấu này.
--    Trường cấm sửa (mục đích, loại hình, địa chỉ) đã chặn ở 0045; gói, ngày, hạn ở 0007.
-- 2) so_ngay_hien_thi: số ngày khách chọn chỉ được tính khi CÓ TRONG BẢNG GIÁ —
--    không nhận số ngày tuỳ ý gửi từ trình duyệt (y hệt soNgayHienThi trong billing.ts);
--    điều kiện khuyến mãi xét ĐỦ như huongKhuyenMai: chạy/hạng/đối tượng/còn lượt.
-- ============================================================================

create or replace function public.danh_dau_tin_da_sua()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_bo text[] := array['nhac_het_han', 'da_sua_luc', 'bao_da_nhan'];
begin
  -- Admin / máy chủ / cron: không đánh dấu (admin sửa là đã kiểm).
  if auth.uid() is null or public.is_admin() then return new; end if;
  -- Hàm đếm lượt xem (0037) chạy dưới quyền người xem — không phải sửa tin.
  if coalesce(current_setting('app.dem_luot_xem', true), '') = 'co' then return new; end if;

  -- Khách không được tự xoá dấu "đã sửa" đang chờ admin kiểm.
  if old.details ? 'da_sua_luc' and not (coalesce(new.details, '{}'::jsonb) ? 'da_sua_luc') then
    new.details := coalesce(new.details, '{}'::jsonb) || jsonb_build_object('da_sua_luc', old.details->'da_sua_luc');
  end if;

  if old.status = 'approved' and new.status = 'approved' and (
       new.title is distinct from old.title
    or new.description is distinct from old.description
    or new.price_vnd is distinct from old.price_vnd
    or new.area_m2 is distinct from old.area_m2
    or new.built_area_m2 is distinct from old.built_area_m2
    or new.beds is distinct from old.beds
    or new.baths is distinct from old.baths
    or new.images is distinct from old.images
    or (coalesce(new.details, '{}'::jsonb) - v_bo) is distinct from (coalesce(old.details, '{}'::jsonb) - v_bo)
  ) then
    new.details := coalesce(new.details, '{}'::jsonb) || jsonb_build_object('da_sua_luc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tin_da_sua on public.listings;
create trigger trg_tin_da_sua
  before update on public.listings
  for each row execute function public.danh_dau_tin_da_sua();

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
  f as (select data->'free' fr from b),
  t as (
    select (t->>'days')::int ngay
      from b,
           jsonb_array_elements(coalesce(
             b.data->'congBo'->(case when p_purpose in ('thue', 'can-thue') then 'thue' else 'ban' end)->'plans',
             b.data->'plans')) p,
           jsonb_array_elements(p->'terms') t
     where p->>'tierId' = p_tier)
  select case
    when p_tier = coalesce((select fr->>'tierId' from f), 'basic')
     and coalesce((select (fr->>'active')::boolean from f), false)
     and (select coalesce(nullif(fr->>'from', ''), '0001-01-01')::date from f) <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
     and (select coalesce(nullif(fr->>'to', ''), '9999-12-31')::date from f) >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
     -- Đối tượng + lượt: y hệt huongKhuyenMai (billing.ts). Tin admin đăng hộ (không chủ) = hưởng.
     and (p_owner is null
          or exists (
            select 1 from profiles p, f
             where p.id = p_owner
               and (   f.fr->>'audience' = 'all'
                    or (f.fr->>'audience' = 'new' and p_luc - p.created_at <= make_interval(days => (f.fr->>'days')::int))
                    or f.fr->>'audience' = coalesce(p.role::text, 'buyer'))
               and (coalesce((f.fr->>'quota')::int, 0) = 0 or coalesce(p.free_quota, 0) > 0)))
    then (select (fr->>'days')::int from f)
    when exists (select 1 from t where ngay = p_so_ngay_chon) then p_so_ngay_chon
    else coalesce((select min(ngay) from t), 7)
  end;
$$;
