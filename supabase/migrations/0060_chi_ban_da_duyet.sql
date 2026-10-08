-- ============================================================================
-- 0060 — GIÁ · CHƯƠNG TRÌNH · CHÍNH SÁCH: CHỈ BẢN ĐÃ DUYỆT (chủ dự án 09/10/2026)
-- "Không duyệt = không hiển thị, không hiệu lực. Ngoài nguồn admin là cấm hết."
--
-- 1) so_ngay_hien_thi: tin hưởng chương trình miễn phí hiển thị đúng "Số ngày hiển thị mỗi tin"
--    của chương trình đã duyệt (billing.free.hienThi); không còn số 7 ngày viết sẵn — gói không
--    có trong bảng giá đã duyệt thì 0 ngày (máy chủ đã chặn duyệt những tin này).
-- 2) site_content "billing" và "quy_dinh_gia": chỉ máy chủ ghi (sau khi chủ dự án bấm Duyệt).
--    Tài khoản admin trên trình duyệt KHÔNG ghi thẳng được nữa — không có đường thứ hai.
-- ============================================================================

create or replace function public.so_ngay_hien_thi(
  p_tier text, p_purpose text, p_owner uuid, p_luc timestamptz, p_so_ngay_chon int
)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $function$
  with b as (select data from site_content where key = 'billing'),
  f as (
    select data->'free' fr,
           coalesce(nullif(data->'free'->>'from', ''), '0001-01-01')::date tu,
           coalesce(nullif(data->'free'->>'to', ''), '9999-12-31')::date den
      from b
  ),
  t as (
    select (t->>'days')::int ngay
      from b,
           jsonb_array_elements(coalesce(
             b.data->'congBo'->(case when p_purpose in ('thue', 'can-thue') then 'thue' else 'ban' end)->'plans',
             b.data->'plans')) p,
           jsonb_array_elements(p->'terms') t
     where p->>'tierId' = p_tier)
  select case
    when p_tier = (select fr->>'tierId' from f)
     and coalesce((select (fr->>'active')::boolean from f), false)
     and (
       (p_owner is null
        and (select tu from f) <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
        and (select den from f) >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date)
       or exists (
         select 1 from profiles p, f
          where p.id = p_owner
            and (
              (f.fr->>'audience' = 'new'
               and (p.ngay_thanh_vien at time zone 'Asia/Ho_Chi_Minh')::date between f.tu and f.den
               and p_luc >= p.ngay_thanh_vien
               and p_luc - p.ngay_thanh_vien <= make_interval(days => (f.fr->>'days')::int))
              or ((f.fr->>'audience' = 'all' or f.fr->>'audience' = coalesce(p.role::text, 'buyer'))
                  and f.tu <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
                  and f.den >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date))
            and (coalesce((f.fr->>'quota')::int, 0) = 0 or coalesce(p.free_quota, 0) > 0))
     )
    then (select coalesce((fr->>'hienThi')::int, (fr->>'days')::int) from f)
    when exists (select 1 from t where ngay = p_so_ngay_chon) then p_so_ngay_chon
    else coalesce((select min(ngay) from t), 0)
  end;
$function$;

-- Chỉ máy chủ (service_role, bỏ qua RLS) ghi bảng giá / quy định ra web.
drop policy if exists "site_content_write_admin" on public.site_content;
create policy "site_content_write_admin" on public.site_content
  for all using ( public.is_admin() and key not in ('billing', 'quy_dinh_gia') )
  with check ( public.is_admin() and key not in ('billing', 'quy_dinh_gia') );
