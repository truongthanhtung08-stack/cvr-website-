-- ============================================================================
-- 0057 — MIỄN PHÍ THÀNH VIÊN MỚI XÉT THEO NGÀY TẠO TÀI KHOẢN (chủ dự án chốt 03/10/2026)
-- ----------------------------------------------------------------------------
-- Chương trình "Miễn phí thành viên mới" (Admin → Giá & quy định, billing.free):
--   · Thành viên TẠO TÀI KHOẢN trong thời gian chương trình (from–to) được ưu đãi.
--   · Tin của thành viên đó đăng trong free.days ngày đầu kể từ ngày tạo tài khoản
--     → miễn phí, hiển thị đúng free.days ngày (kể cả khi đăng sau ngày kết thúc).
--   · Tin admin đăng hộ (không có chủ) và đối tượng all/vai trò → như cũ: NGÀY ĐĂNG nằm
--     trong thời gian chương trình.
-- Y hệt hàm huongKhuyenMai trong src/lib/billing.ts — MỘT LUẬT, MỘT NGUỒN (admin).
-- Dựng từ bản ĐANG CHẠY (pg_get_functiondef 03/10) — chỉ đổi điều kiện thành viên mới.
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
    when p_tier = coalesce((select fr->>'tierId' from f), 'basic')
     and coalesce((select (fr->>'active')::boolean from f), false)
     and (
       -- Tin admin đăng hộ: NGÀY ĐĂNG trong thời gian chương trình
       (p_owner is null
        and (select tu from f) <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
        and (select den from f) >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date)
       or exists (
         select 1 from profiles p, f
          where p.id = p_owner
            and (
              -- Thành viên mới: TẠO TÀI KHOẢN trong thời gian chương trình + tin trong free.days ngày đầu
              (f.fr->>'audience' = 'new'
               and (p.created_at at time zone 'Asia/Ho_Chi_Minh')::date between f.tu and f.den
               and p_luc - p.created_at <= make_interval(days => (f.fr->>'days')::int))
              -- Đối tượng all / theo vai trò: ngày đăng trong thời gian chương trình (như cũ)
              or ((f.fr->>'audience' = 'all' or f.fr->>'audience' = coalesce(p.role::text, 'buyer'))
                  and f.tu <= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date
                  and f.den >= (p_luc at time zone 'Asia/Ho_Chi_Minh')::date))
            and (coalesce((f.fr->>'quota')::int, 0) = 0 or coalesce(p.free_quota, 0) > 0))
     )
    then (select (fr->>'days')::int from f)
    when exists (select 1 from t where ngay = p_so_ngay_chon) then p_so_ngay_chon
    else coalesce((select min(ngay) from t), 7)
  end;
$function$;
