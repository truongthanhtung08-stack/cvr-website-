-- ============================================================================
-- 0069 — HỒ SƠ TRỐNG SỐ ĐIỆN THOẠI MÀ LÚC ĐĂNG KÝ KHÁCH ĐÃ KHAI SỐ (05/11/2026)
-- ----------------------------------------------------------------------------
-- Khách khai số lúc đăng ký → số nằm ở auth.users.raw_user_meta_data->>'phone', nhưng một số
-- hồ sơ (profiles.phone) bị trống → form đăng tin trống ô SĐT, Zalo không gửi được thông báo.
-- Đo 05/11: 3 tài khoản. Chỉ ĐIỀN chỗ trống, không đổi số đang có, không đánh dấu đã xác minh,
-- bỏ qua số đã thuộc hồ sơ khác (một số một tài khoản).
-- ============================================================================
with nguon as (
  select u.id,
         case
           when regexp_replace(u.raw_user_meta_data->>'phone', '\D', '', 'g') ~ '^84\d{9}$'
             then '0' || substr(regexp_replace(u.raw_user_meta_data->>'phone', '\D', '', 'g'), 3)
           else regexp_replace(u.raw_user_meta_data->>'phone', '\D', '', 'g')
         end as so
    from auth.users u
   where coalesce(u.raw_user_meta_data->>'phone', '') <> ''
)
update public.profiles p
   set phone = n.so
  from nguon n
 where p.id = n.id
   and p.phone is null
   and n.so ~ '^0\d{9}$'
   and not exists (select 1 from public.profiles k where k.id <> p.id and k.phone = n.so and k.role is distinct from 'admin');

-- ── SỬA GỐC: tạo tài khoản mới → hồ sơ nhận luôn số khách khai lúc đăng ký ───────────────────
-- Trước đây handle_new_user (0001) chỉ lấy auth.users.phone (số dùng để đăng nhập, chỉ có khi đăng ký qua Zalo),
-- bỏ qua số khai kèm (raw_user_meta_data.phone) → số nằm HAI chỗ, hồ sơ trống. Nay: không có số đăng nhập thì lấy số
-- khai kèm (chuẩn 0xxxxxxxxx), trừ khi số đó đã thuộc hồ sơ khác (không bao giờ làm hỏng việc đăng ký).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_so text := regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '\D', '', 'g');
begin
  if v_so ~ '^84\d{9}$' then v_so := '0' || substr(v_so, 3); end if;
  -- Tài khoản QUẢN TRỊ không tính là "số đã có chủ" (chủ dự án 05/11/2026: "liên quan gì đến admin")
  if v_so !~ '^0\d{9}$' or exists (select 1 from public.profiles k where k.phone = v_so and k.role is distinct from 'admin') then v_so := null; end if;
  insert into public.profiles (id, email, phone, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.phone, ''), v_so),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
