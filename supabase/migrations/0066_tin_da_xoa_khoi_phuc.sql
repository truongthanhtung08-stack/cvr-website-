-- ============================================================================
-- 0066 — XOÁ TIN = ĐƯA VÀO MỤC "ĐÃ XOÁ" TRONG ADMIN, CÓ NÚT KHÔI PHỤC
-- ----------------------------------------------------------------------------
-- Chủ dự án 26/10/2026: "xóa thì lưu vào mục xóa trong admin · có nút khôi phục".
-- Trước đây mọi nút Xoá (admin, khách xoá tin nháp) xoá hẳn khỏi bảng — không lấy lại được.
--   · Trạng thái mới 'deleted': không hiện trên web (web chỉ hiện 'approved').
--   · xoa_tin(ids)       — chủ tin hoặc admin; nhớ trạng thái trước khi xoá.
--   · khoi_phuc_tin(ids) — CHỈ admin; trả tin về đúng trạng thái trước khi xoá.
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================

alter type public.listing_status add value if not exists 'deleted';

alter table public.listings
  add column if not exists trang_thai_truoc_xoa public.listing_status,
  add column if not exists xoa_luc timestamptz;

-- Trigger chặn cột đặc quyền (bản 0037) + luật xoá:
--   · chủ tin được chuyển tin của mình sang 'deleted' (qua xoa_tin),
--   · chủ tin KHÔNG được tự đưa tin ra khỏi 'deleted' — chỉ admin khôi phục,
--   · hai cột nhớ xoá chỉ đổi qua hàm xoa_tin (cờ app.xoa_tin).
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

  -- Tin đã xoá: chỉ admin khôi phục
  if old.status = 'deleted' and new.status is distinct from old.status then
    raise exception 'Tin đã xoá — chỉ quản trị viên khôi phục được';
  end if;

  -- Cột nhớ xoá: chỉ đổi qua hàm xoa_tin
  if (new.trang_thai_truoc_xoa is distinct from old.trang_thai_truoc_xoa
      or new.xoa_luc is distinct from old.xoa_luc)
     and coalesce(current_setting('app.xoa_tin', true), '') <> 'co' then
    raise exception 'Không được sửa cột xoá tin';
  end if;

  -- Status: chủ tin chỉ được chuyển sang draft / pending / hidden / deleted
  -- (đăng tin = pending chờ duyệt; không bao giờ tự approve)
  if new.status is distinct from old.status
     and new.status not in ('draft', 'pending', 'hidden', 'deleted') then
    raise exception 'Trạng thái không hợp lệ — tin phải chờ Coastal Land kiểm duyệt';
  end if;

  return new;
end;
$function$;

-- XOÁ: chủ tin xoá tin của mình, admin xoá mọi tin. Trả về số tin đã xoá.
create or replace function public.xoa_tin(p_ids text[])
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_so integer;
begin
  if auth.uid() is null then
    raise exception 'Chưa đăng nhập';
  end if;
  perform set_config('app.xoa_tin', 'co', true);
  update public.listings
     set trang_thai_truoc_xoa = status,
         status = 'deleted',
         xoa_luc = now()
   where id = any(p_ids)
     and status <> 'deleted'
     and (owner_id = auth.uid() or public.is_admin());
  get diagnostics v_so = row_count;
  return v_so;
end;
$$;

-- KHÔI PHỤC: chỉ admin. Tin về đúng trạng thái trước khi xoá (không rõ thì về 'hidden').
create or replace function public.khoi_phuc_tin(p_ids text[])
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_so integer;
begin
  if not public.is_admin() then
    raise exception 'Chỉ quản trị viên khôi phục được tin';
  end if;
  update public.listings
     set status = coalesce(trang_thai_truoc_xoa, 'hidden'),
         trang_thai_truoc_xoa = null,
         xoa_luc = null
   where id = any(p_ids)
     and status = 'deleted';
  get diagnostics v_so = row_count;
  return v_so;
end;
$$;

revoke all on function public.xoa_tin(text[]) from public;
revoke all on function public.khoi_phuc_tin(text[]) from public;
grant execute on function public.xoa_tin(text[]) to authenticated;
grant execute on function public.khoi_phuc_tin(text[]) to authenticated;
