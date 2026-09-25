-- ============================================================================
-- 0045 — SỬA TIN: CÙNG BẤT ĐỘNG SẢN THÌ SỬA THOẢI MÁI, BĐS KHÁC PHẢI ĐĂNG MỚI
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt 25/09/2026 (theo Batdongsan): tin đã đăng (đang hiện, hết hạn,
-- chờ duyệt, bị từ chối, đã ẩn) chỉ được sửa nội dung của CHÍNH căn đó — giá,
-- ảnh, mô tả, diện tích, liên hệ… đều sửa được. KHÔNG được biến tin thành một
-- BĐS khác bằng cách đổi: mục đích (bán/thuê), loại hình, tỉnh, quận/huyện,
-- phường/xã, địa chỉ chi tiết. Muốn vậy phải ĐĂNG TIN MỚI (tin mới = phí mới,
-- lượt xem mới — không mượn lượt xem, vị trí của tin cũ).
-- Chặn ở CSDL vì form sửa ghi thẳng vào bảng: giao diện có bị lách cũng không qua.
-- Tin NHÁP (chưa đăng) sửa tự do. Admin / service role không bị chặn.
-- ============================================================================
create or replace function public.chuan_dia_chi(x text)
returns text language sql immutable as $$
  select lower(regexp_replace(coalesce(x, ''), '[^[:alnum:]]', '', 'g'));
$$;

create or replace function public.giu_nguyen_bds()
returns trigger
language plpgsql
security definer
set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if old.status = 'draft' then
    return new;
  end if;
  if new.purpose is distinct from old.purpose
     or new.type is distinct from old.type
     or coalesce(new.province, '') <> coalesce(old.province, '')
     or coalesce(new.district, '') <> coalesce(old.district, '')
     or coalesce(new.ward, '') <> coalesce(old.ward, '')
     or public.chuan_dia_chi(new.details->>'addressDetail') <> public.chuan_dia_chi(old.details->>'addressDetail') then
    raise exception 'BDS_KHAC: Tin đã đăng chỉ sửa được nội dung của chính bất động sản đó. Muốn đăng bất động sản khác (khác mục đích, loại hình hoặc địa chỉ), vui lòng đăng tin mới.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_giu_nguyen_bds on public.listings;
create trigger trg_giu_nguyen_bds
  before update on public.listings
  for each row execute function public.giu_nguyen_bds();
