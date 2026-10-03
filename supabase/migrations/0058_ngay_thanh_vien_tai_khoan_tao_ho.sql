-- ============================================================================
-- 0058 — TÀI KHOẢN TẠO HỘ + NGÀY BẮT ĐẦU LÀ THÀNH VIÊN (chủ dự án chốt 03/10/2026)
-- ----------------------------------------------------------------------------
-- "Những thành viên tôi tạo hộ, nếu họ chính thức vào tài khoản trong thời gian khuyến
--  mãi cũng tính là mới — cho đến khi tôi đổi chính sách từ admin."
--
--   · profiles.tao_ho       — tài khoản Coastal Land tạo thay khách (Admin → Khách hàng →
--                              Tạo khách hàng tự gắn). Phân biệt với khách tự đăng ký.
--   · vao_chinh_thuc_luc    — lúc CHÍNH CHỦ vào lần đầu, máy tự ghi:
--                              (a) xác nhận số điện thoại của mình (mã Zalo, gộp tài khoản), hoặc
--                              (b) đăng nhập lần đầu (tài khoản tạo từ admin chưa ai đăng nhập),
--                                  hay đăng nhập vào một ngày sau ngày tạo (tài khoản tạo hộ cũ).
--   · ngay_thanh_vien       — NGÀY BẮT ĐẦU LÀ THÀNH VIÊN = coalesce(vao_chinh_thuc_luc, created_at).
--                              Chương trình "Miễn phí thành viên mới" xét theo cột này
--                              (hàm so_ngay_hien_thi bên dưới + huongKhuyenMai trong code).
-- ============================================================================
alter table public.profiles add column if not exists tao_ho boolean not null default false;
alter table public.profiles add column if not exists vao_chinh_thuc_luc timestamptz;
alter table public.profiles add column if not exists ngay_thanh_vien timestamptz
  generated always as (coalesce(vao_chinh_thuc_luc, created_at)) stored;

-- (a) Chính chủ xác nhận số điện thoại của mình
create or replace function public.ghi_vao_chinh_thuc_sdt()
returns trigger
language plpgsql
as $$
begin
  if new.tao_ho and new.vao_chinh_thuc_luc is null
     and coalesce(old.phone_verified, false) = false and new.phone_verified = true then
    new.vao_chinh_thuc_luc := now();
  end if;
  return new;
end;
$$;
drop trigger if exists trg_ghi_vao_chinh_thuc_sdt on public.profiles;
create trigger trg_ghi_vao_chinh_thuc_sdt
  before update of phone_verified on public.profiles
  for each row execute function public.ghi_vao_chinh_thuc_sdt();

-- (b) Chính chủ đăng nhập lần đầu
create or replace function public.ghi_vao_chinh_thuc()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.last_sign_in_at is not null
     and old.last_sign_in_at is distinct from new.last_sign_in_at
     and (old.last_sign_in_at is null
          or (new.last_sign_in_at at time zone 'Asia/Ho_Chi_Minh')::date > (new.created_at at time zone 'Asia/Ho_Chi_Minh')::date)
  then
    update public.profiles
       set vao_chinh_thuc_luc = new.last_sign_in_at
     where id = new.id and tao_ho and vao_chinh_thuc_luc is null;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_ghi_vao_chinh_thuc on auth.users;
create trigger trg_ghi_vao_chinh_thuc
  after update of last_sign_in_at on auth.users
  for each row execute function public.ghi_vao_chinh_thuc();

-- Tài khoản tạo hộ đang có (đối chiếu 03/10/2026): 680cd76a — đăng ký email + mật khẩu
-- 18/07 mang số khách 0905644739, 10 tin, chỉ đăng nhập đúng ngày tạo.
update public.profiles set tao_ho = true where id = '680cd76a-eb73-4720-a45d-0ec803bd87dc';

-- Hàm tính hạn: thành viên mới xét theo ngay_thanh_vien (còn lại giữ nguyên 0057).
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
    then (select (fr->>'days')::int from f)
    when exists (select 1 from t where ngay = p_so_ngay_chon) then p_so_ngay_chon
    else coalesce((select min(ngay) from t), 7)
  end;
$function$;
