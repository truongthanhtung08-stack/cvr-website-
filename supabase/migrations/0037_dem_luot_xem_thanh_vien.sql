-- ============================================================================
-- 0037 — SỬA LỖI: LƯỢT XEM CỦA THÀNH VIÊN ĐÃ ĐĂNG NHẬP KHÔNG BAO GIỜ ĐƯỢC ĐẾM
-- ----------------------------------------------------------------------------
-- Phát hiện 24/09/2026 khi đo 0036: trigger protect_listing_privileged cấm người
-- dùng thường đổi cột view_count (để chủ tin không tự thổi số) — đúng. Nhưng nó
-- chặn LUÔN cả hàm increment_listing_view khi người xem đã đăng nhập, vì hàm chạy
-- trong phiên của chính người xem (auth.uid() có giá trị). Kết quả: cả lệnh bị huỷ,
-- lượt xem của mọi thành viên đăng nhập bị mất; chỉ khách ẩn danh được đếm.
--
-- Cách sửa, chặt nhất có thể:
--   · increment_listing_view bật cờ riêng của giao dịch (`app.dem_luot_xem`)
--     ngay trước lệnh cộng.
--   · Trigger chỉ cho qua khi CÓ cờ đó VÀ chỉ view_count đổi, đổi đúng +1.
--     Mọi cột đặc quyền khác vẫn khoá như cũ. Cờ là cấu hình nội bộ của
--     Postgres, PostgREST không cho gọi set_config từ trình duyệt.
-- ============================================================================

create or replace function public.protect_listing_privileged()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service_role / SQL Editor / admin → cho phép
  end if;

  -- NGOẠI LỆ DUY NHẤT: hàm increment_listing_view cộng đúng 1 lượt xem.
  -- Chỉ view_count đổi (+1), mọi cột khác y nguyên → cho qua.
  if coalesce(current_setting('app.dem_luot_xem', true), '') = 'co'
     and new.view_count = old.view_count + 1
     and (to_jsonb(new) - 'view_count' - 'updated_at') = (to_jsonb(old) - 'view_count' - 'updated_at') then
    return new;
  end if;

  -- Cột đặc quyền tuyệt đối: người thường không bao giờ được đổi
  if new.tier            is distinct from old.tier
     or new.tier_expires_at is distinct from old.tier_expires_at
     or new.published_at is distinct from old.published_at
     or new.view_count   is distinct from old.view_count
     or new.owner_id     is distinct from old.owner_id
     -- Bốn cột tiền — nếu không chặn, khách sửa gia_chua_thue = 0 là đăng VIP miễn phí
     or new.gia_chua_thue is distinct from old.gia_chua_thue
     or new.tien_thue    is distinct from old.tien_thue
     or new.thue_suat    is distinct from old.thue_suat
     or new.da_tru_vi    is distinct from old.da_tru_vi then
    raise exception 'Không được sửa cột đặc quyền của tin (tier/published_at/view_count/owner/tiền)';
  end if;

  -- Status: chủ tin chỉ được chuyển sang draft / pending / hidden
  -- (đăng tin = pending chờ duyệt; không bao giờ tự approve)
  if new.status is distinct from old.status
     and new.status not in ('draft', 'pending', 'hidden') then
    raise exception 'Trạng thái không hợp lệ — tin phải chờ Coastal Land kiểm duyệt';
  end if;

  return new;
end;
$function$;

create or replace function public.increment_listing_view(
  p_listing_id text,
  p_thiet_bi   text default null,
  p_nguon      text default null
)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_chu uuid;
  v_uid uuid := auth.uid();
begin
  select l.owner_id into v_chu
    from public.listings l
   where l.id = p_listing_id and l.status = 'approved';

  -- Tin chưa duyệt / không tồn tại → không ghi thống kê rác.
  if not found then
    return;
  end if;

  -- CHÍNH CHỦ TIN tự xem tin mình → KHÔNG tính là lượt xem.
  if v_uid is not null and v_uid = v_chu then
    return;
  end if;

  -- Cờ cho trigger protect_listing_privileged biết đây là lệnh đếm lượt xem hợp lệ.
  perform set_config('app.dem_luot_xem', 'co', true);
  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id;
  perform set_config('app.dem_luot_xem', '', true);

  insert into public.listing_view_daily as d (listing_id, ngay, luot)
  values (p_listing_id, current_date, 1)
  on conflict (listing_id, ngay) do update set luot = d.luot + 1;

  insert into public.listing_view_event (listing_id, thiet_bi, nguon, la_thanh_vien)
  values (
    p_listing_id,
    case when p_thiet_bi in ('dien_thoai', 'may_tinh') then p_thiet_bi end,
    case when p_nguon in ('google', 'zalo', 'facebook', 'khac', 'truc_tiep', 'trong_web') then p_nguon end,
    v_uid is not null
  );
end;
$$;

grant execute on function public.increment_listing_view(text, text, text) to anon, authenticated;
