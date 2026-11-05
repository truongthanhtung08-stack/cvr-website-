-- ============================================================================
-- 0071 — MỐC THỜI GIAN MỘT CHUẨN: LÚC TIN ĐƯỢC DUYỆT (chủ dự án 06/11/2026)
-- Ẩn rồi Hiện lại (khách hay Admin), duyệt lại tin đã sửa: tin CÒN HẠN, không đổi gói → GIỮ NGUYÊN ngày đăng, hạn, lần đẩy.
-- Lỗi đo 06/11/2026 (tin 3650c745): Admin Hiện lại → trigger tin_luon_co_han mở KỲ MỚI (ngày đăng / lần đẩy = lúc bấm,
-- hạn = lúc bấm + số ngày gói) = gia hạn + đẩy miễn phí.
-- Không đổi: tin mới, tin ĐÃ HẾT HẠN được bật lại, Admin đổi hạng / số ngày → kỳ mới như 0053 · 0062.
-- Chỉ thêm một điều kiện vào bản 0062.
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
           or new.tier_expires_at is null)
      -- 0071: tin CÒN HẠN, không đổi gói, bật lại (Ẩn → Hiện lại, chờ duyệt → Đang đăng) → giữ nguyên mốc lúc duyệt
      and not (old.tier_expires_at is not null
               and old.tier_expires_at > now()
               and old.published_at is not null
               and new.tier is not distinct from old.tier
               and new.tier_days is not distinct from old.tier_days);
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
