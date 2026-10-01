-- ============================================================================
-- 0051 — ĐĂNG TIN BẮT BUỘC TÀI KHOẢN CÓ SỐ ĐIỆN THOẠI (01/10/2026)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt: dù đăng nhập bằng Email/Google/Zalo, tài khoản PHẢI có số điện thoại
-- mới gửi tin được (phục vụ quản trị web). Form đăng tin đã hỏi số; lớp này chặn ở cơ sở
-- dữ liệu để KHÔNG lách được bằng cách gửi thẳng.
--   · Áp dụng khi THÀNH VIÊN (auth.uid() có) đưa tin vào trạng thái 'pending' (chờ duyệt).
--   · Không áp: lưu nháp, admin, việc của máy chủ / nhập tin hộ (không có auth.uid()).
-- ============================================================================
create or replace function public.tin_bat_buoc_co_so()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_phone text;
  v_role  text;
begin
  if auth.uid() is null or new.status is distinct from 'pending' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status is not distinct from 'pending' then
    return new; -- sửa tin đang chờ duyệt, không đổi trạng thái
  end if;

  select phone, role into v_phone, v_role from public.profiles where id = auth.uid();
  if v_role = 'admin' then
    return new;
  end if;
  if coalesce(btrim(v_phone), '') = '' then
    raise exception 'Tài khoản cần có số điện thoại trước khi đăng tin.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tin_bat_buoc_co_so on public.listings;
create trigger trg_tin_bat_buoc_co_so
  before insert or update of status on public.listings
  for each row execute function public.tin_bat_buoc_co_so();
