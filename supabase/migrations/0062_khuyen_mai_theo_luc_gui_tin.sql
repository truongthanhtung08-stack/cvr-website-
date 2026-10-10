-- ============================================================================
-- 0062 — KHUYẾN MÃI THÀNH VIÊN MỚI XÉT THEO LÚC KHÁCH GỬI TIN (chủ dự án 10/10/2026)
-- "Thành viên mới · gói Basic · trong 30 ngày đầu · không giới hạn số tin. Đăng ký không duyệt,
--  chỉ duyệt tin." → tin gửi trong 30 ngày đầu là tin khuyến mãi, admin duyệt lúc nào cũng vậy.
-- Máy chủ (duyet/route.ts, lucGuiTin) đã xét theo mốc này; ở đây cho trigger tính hạn
-- (tin_luon_co_han — chạy khi admin sửa tin trong form admin) dùng CÙNG mốc.
-- Chỉ đổi tham số p_luc truyền vào so_ngay_hien_thi; hạn hiển thị vẫn tính từ lúc lên sóng.
-- ============================================================================

create or replace function public.tin_luon_co_han()
returns trigger
language plpgsql
as $$
declare
  v_chon int;
  v_ky_moi boolean;
begin
  if new.status <> 'approved' then return new; end if;

  if tg_op = 'INSERT' then
    v_ky_moi := new.tier_expires_at is null;
  elsif auth.uid() is not null and not public.is_admin() then
    -- KHÁCH tự sửa tin KHÔNG BAO GIỜ được kỳ mới (đổi tier_days là gia hạn miễn phí).
    -- Kỳ mới của khách chỉ đến từ máy chủ: duyệt tin, đăng lại — đều tự ghi hạn.
    v_ky_moi := false;
  else
    v_ky_moi := new.tier_expires_at is not distinct from old.tier_expires_at
      and (old.status <> 'approved'
           or new.tier is distinct from old.tier
           or new.tier_days is distinct from old.tier_days
           or new.tier_expires_at is null);
  end if;
  if not v_ky_moi then return new; end if;

  -- Số ngày đã chọn — chỉ tính khi gói chọn đúng hạng đang lên sóng.
  v_chon := coalesce(
    new.tier_days,
    case when new.details->'plan'->>'tier' = new.tier::text
         then nullif(new.details->'plan'->>'days', '')::int end);

  if tg_op = 'UPDATE' then
    new.published_at := now();
    new.bumped_at := now();
  end if;
  new.tier_expires_at := coalesce(new.published_at, now())
    + make_interval(days => public.so_ngay_hien_thi(
        new.tier::text, new.purpose::text, new.owner_id,
        -- Mốc xét "thành viên mới" = LÚC KHÁCH GỬI TIN (đăng lại ghi details.gui_luc; tin mới
        -- là lúc tạo tin) — không phải lúc admin duyệt. Hạn vẫn tính từ lúc lên sóng.
        coalesce(nullif(new.details->>'gui_luc', '')::timestamptz, new.created_at, now()),
        v_chon));
  return new;
end;
$$;
