-- ============================================================================
-- VÍ TIỀN: CỘNG / TRỪ NGUYÊN TỬ — chống mất tiền khi hai việc chạy cùng lúc
-- ----------------------------------------------------------------------------
-- LỖI ĐANG CÓ (trước migration này):
--   Cả webhook nạp tiền lẫn route duyệt tin đều làm kiểu ĐỌC RỒI GHI ĐÈ:
--       đọc balance  →  tính  →  update profiles set balance = <số vừa tính>
--   Hai việc chạy chồng nhau là mất tiền thật:
--     · 10:00:00.0  Admin bấm Duyệt tin  → đọc balance = 500.000
--     · 10:00:00.2  PayOS báo khách nạp  → balance = 1.500.000
--     · 10:00:00.4  Route duyệt ghi đè   → balance = 500.000 − 300.000 = 200.000
--     → 1.000.000 khách vừa nạp BIẾN MẤT.
--
-- CÁCH SỬA: để CHÍNH CƠ SỞ DỮ LIỆU cộng/trừ trên giá trị hiện tại
-- (update ... set balance = balance + x). Postgres khoá dòng trong lúc update
-- nên hai lệnh chạy cùng lúc vẫn ra đúng tổng.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0001_profiles.sql (profiles có balance, total_topup, member_level).
-- ============================================================================

-- 1) CỘNG VÍ (nạp tiền) ------------------------------------------------------
-- Cộng số dư + tổng đã nạp trong MỘT lệnh. Trả về số dư mới để báo cho khách.
-- p_cap: cấp hội viên tính lại theo tổng đã nạp (do phía web tính, vì ngưỡng cấp
-- nằm trong site_content chứ không nằm trong CSDL).
create or replace function public.cong_vi(
  p_user uuid,
  p_tien bigint,
  p_cap  text default null
)
returns table (so_du bigint, tong_nap bigint)
language plpgsql
security definer
set search_path = public as $$
begin
  if p_tien <= 0 then
    raise exception 'So tien cong vi phai lon hon 0';
  end if;

  return query
  update public.profiles
     set balance      = coalesce(balance, 0) + p_tien,
         total_topup  = coalesce(total_topup, 0) + p_tien,
         member_level = coalesce(p_cap, member_level)
   where id = p_user
  returning balance::bigint, total_topup::bigint;
end;
$$;

comment on function public.cong_vi(uuid, bigint, text) is
  'Cộng ví nguyên tử khi khách nạp tiền — chỉ webhook thanh toán gọi (service role).';

-- 2) TRỪ VÍ (thu phí gói tin) ------------------------------------------------
-- CHỈ trừ khi ví ĐỦ TIỀN. Không đủ → không trả dòng nào, phía web biết là
-- không trừ được, KHÔNG bao giờ để số dư âm.
create or replace function public.tru_vi(
  p_user uuid,
  p_tien bigint
)
returns table (so_du bigint)
language plpgsql
security definer
set search_path = public as $$
begin
  if p_tien <= 0 then
    raise exception 'So tien tru vi phai lon hon 0';
  end if;

  return query
  update public.profiles
     set balance = coalesce(balance, 0) - p_tien
   where id = p_user
     and coalesce(balance, 0) >= p_tien   -- thiếu tiền thì không trừ dòng nào
  returning balance::bigint;
end;
$$;

comment on function public.tru_vi(uuid, bigint) is
  'Trừ ví nguyên tử khi thu phí gói tin — chỉ trừ khi đủ tiền, không cho số dư âm.';

-- 3) DÙNG MỘT LƯỢT ĐĂNG TIN MIỄN PHÍ ----------------------------------------
-- Chỉ trừ khi CÒN lượt. Hết lượt → không trả dòng nào, phía web biết là khách
-- đã hết suất miễn phí và phải thu tiền. Nguyên tử để khách bấm đăng nhiều tin
-- cùng lúc không tiêu được nhiều hơn số suất đang có.
create or replace function public.dung_luot_mien_phi(p_user uuid)
returns table (con_lai integer)
language plpgsql
security definer
set search_path = public as $$
begin
  return query
  update public.profiles
     set free_quota = free_quota - 1
   where id = p_user
     and coalesce(free_quota, 0) > 0
  returning free_quota;
end;
$$;

comment on function public.dung_luot_mien_phi(uuid) is
  'Trừ một lượt đăng tin miễn phí — chỉ trừ khi còn lượt, tránh tiêu vượt số suất.';

-- 4) QUYỀN GỌI ---------------------------------------------------------------
-- KHÔNG cấp cho anon/authenticated: hai hàm này đổi tiền, chỉ máy chủ của web
-- (service role) được gọi. Cấp cho người dùng thường là ai cũng tự cộng tiền.
revoke all on function public.cong_vi(uuid, bigint, text)  from public, anon, authenticated;
revoke all on function public.tru_vi(uuid, bigint)         from public, anon, authenticated;
revoke all on function public.dung_luot_mien_phi(uuid)     from public, anon, authenticated;
grant execute on function public.cong_vi(uuid, bigint, text) to service_role;
grant execute on function public.tru_vi(uuid, bigint)        to service_role;
grant execute on function public.dung_luot_mien_phi(uuid)    to service_role;
