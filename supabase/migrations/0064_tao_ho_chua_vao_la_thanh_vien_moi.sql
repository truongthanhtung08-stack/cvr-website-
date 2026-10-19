-- ============================================================================
-- 0064 — TÀI KHOẢN TẠO HỘ CHƯA VÀO = THÀNH VIÊN MỚI (chủ dự án chốt 19/10/2026)
-- ----------------------------------------------------------------------------
-- "Thành viên tôi tạo hộ mà chưa tự đăng nhập vào, chưa tự đăng (kể cả tin hết hạn) cũng
--  là thành viên mới."
--
-- Trước (0058/0060): ngay_thanh_vien = coalesce(vao_chinh_thuc_luc, created_at) → tài khoản
-- tạo hộ chưa vào bị tính ngày thành viên từ NGÀY TẠO HỘ; qua free.days ngày là mất ưu đãi
-- dù chính chủ chưa vào lần nào (tin đăng hộ hết hạn, đăng lại thì tính giá thường).
-- Nay: tạo hộ + chưa vào chính thức (vao_chinh_thuc_luc trống) → tính NHƯ TIN ADMIN ĐĂNG HỘ
-- (p_owner trống): hưởng chương trình khi lúc gửi tin nằm trong from–to của chương trình.
-- Chính chủ vào lần đầu → vao_chinh_thuc_luc ghi lại (trigger 0058) → từ đó xét theo
-- ngay_thanh_vien như mọi thành viên mới. Không đổi cột, không đổi bảng; chỉ thay hàm.
-- Chi phí: không thêm truy vấn, không thêm cron.
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
       -- Tin admin đăng hộ (không có chủ) HOẶC chủ là tài khoản tạo hộ chưa vào chính thức.
       ((p_owner is null
         or exists (select 1 from profiles p0 where p0.id = p_owner and p0.tao_ho and p0.vao_chinh_thuc_luc is null))
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
