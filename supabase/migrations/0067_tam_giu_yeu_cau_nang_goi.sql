-- ============================================================================
-- 0067 — TẠM GIỮ TIỀN YÊU CẦU NÂNG GÓI (chủ dự án chốt 01/11/2026)
-- ----------------------------------------------------------------------------
-- Khách bấm "Nâng gói" trên tin ĐANG HIỆN: tin vẫn hiện bình thường với gói cũ,
-- yêu cầu nằm ở listings.details.nang_cho (tier, days, tongTra đã gồm GTGT…) chờ
-- admin duyệt. Duyệt mới trừ tiền + đổi gói; từ chối / khách huỷ là xoá nang_cho.
-- Giống 0056: tạm giữ TÍNH TRỰC TIẾP từ bảng tin, không có sổ riêng → duyệt (route
-- chuyển nang_cho sang nang_dang_duyet trước khi trừ ví) / từ chối / huỷ là tự nhả.
-- Chỉ thêm phần nâng vào tien_tam_giu; mọi hàm chi tiền (tru_vi, day_tin, mua_goi_up,
-- tao_hoi_vien) và so_du_kha_dung giữ nguyên, tự tính thêm phần này.
-- ============================================================================

-- Phí một yêu cầu nâng gói (đã gồm GTGT — máy chủ tính lúc khách gửi).
create or replace function public.phi_nang_cho(p_details jsonb)
returns bigint language sql immutable as $$
  select greatest(0, round(coalesce(nullif(p_details->'nang_cho'->>'tongTra', '')::numeric, 0)))::bigint;
$$;

-- Tổng tiền đang tạm giữ của một khách: tin chờ duyệt (0056) + yêu cầu nâng gói đang chờ.
create or replace function public.tien_tam_giu(p_user uuid, p_bo_tin text default null)
returns bigint language sql stable security definer set search_path to 'public' as $$
  select (
    coalesce((select sum(public.phi_tin_cho_duyet(details))
                from public.listings
               where owner_id = p_user
                 and status = 'pending'
                 and coalesce(da_tru_vi, false) = false
                 and (p_bo_tin is null or id::text <> p_bo_tin)), 0)
    + coalesce((select sum(public.phi_nang_cho(details))
                  from public.listings
                 where owner_id = p_user
                   and status = 'approved'
                   and details ? 'nang_cho'
                   and (p_bo_tin is null or id::text <> p_bo_tin)), 0)
  )::bigint;
$$;
