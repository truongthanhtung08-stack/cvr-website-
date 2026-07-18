-- ============================================================================
-- FIX: chủ tin không thể "Đăng tin" tin nháp của mình (draft → pending) vì
-- trigger protect_listing_privileged chặn MỌI thay đổi cột status với người thường.
-- Nới đúng mức: CHỦ TIN được chuyển status của tin mình giữa các trạng thái an toàn
--   draft / pending / hidden  (lưu nháp · gửi duyệt · tự ẩn tin)
-- và khi sửa tin đã duyệt thì được đưa về pending (duyệt lại).
-- TUYỆT ĐỐI KHÔNG cho tự đặt approved/rejected/expired, không đụng tier /
-- published_at / view_count / owner_id (vẫn chặn như cũ).
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================

create or replace function public.protect_listing_privileged()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service_role / SQL Editor / admin → cho phép
  end if;

  -- Cột đặc quyền tuyệt đối: người thường không bao giờ được đổi
  if new.tier            is distinct from old.tier
     or new.tier_expires_at is distinct from old.tier_expires_at
     or new.published_at is distinct from old.published_at
     or new.view_count   is distinct from old.view_count
     or new.owner_id     is distinct from old.owner_id then
    raise exception 'Không được sửa cột đặc quyền của tin (tier/published_at/view_count/owner)';
  end if;

  -- Status: chủ tin chỉ được chuyển sang draft / pending / hidden
  -- (đăng tin = pending chờ duyệt; không bao giờ tự approve)
  if new.status is distinct from old.status
     and new.status not in ('draft', 'pending', 'hidden') then
    raise exception 'Trạng thái không hợp lệ — tin phải chờ Coastal Land kiểm duyệt';
  end if;

  return new;
end;
$$;
