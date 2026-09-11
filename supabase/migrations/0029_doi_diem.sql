-- ============================================================================
-- ĐỔI ĐIỂM THƯỞNG RA SỐ DƯ VÍ
-- ----------------------------------------------------------------------------
-- LỖI ĐANG CÓ: trang /tai-khoan/doi-diem bấm nút chỉ hiện dòng chữ "Đã gửi yêu
-- cầu đổi điểm, số dư sẽ được cộng sau khi quản trị viên xác nhận" — nhưng KHÔNG
-- ghi yêu cầu đi đâu cả và admin không có chỗ nào nhận. Khách chờ mãi không thấy
-- tiền, trong khi chương trình điểm đang bật.
--
-- CÁCH LÀM: đổi điểm ăn ngay, không cần admin duyệt — điểm vốn sinh ra từ tiền
-- khách đã nạp, đổi ra cũng chỉ về lại ví của chính họ, tiền không rời hệ thống.
-- Trừ điểm và cộng ví nằm TRONG MỘT LỆNH nên không bao giờ có chuyện mất điểm
-- mà không được tiền (hoặc ngược lại).
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0001_profiles.sql (profiles có balance, points).
-- ============================================================================

create or replace function public.doi_diem(
  p_user uuid,
  p_diem integer,
  p_tien bigint
)
returns table (diem_con integer, so_du bigint)
language plpgsql
security definer
set search_path = public as $$
begin
  if p_diem <= 0 or p_tien <= 0 then
    raise exception 'So diem va so tien doi phai lon hon 0';
  end if;

  -- Trừ điểm + cộng ví trong MỘT lệnh, và chỉ khi CÒN ĐỦ ĐIỂM.
  -- Không đủ → không trả dòng nào, phía web biết là chưa đổi được.
  return query
  update public.profiles
     set points  = coalesce(points, 0) - p_diem,
         balance = coalesce(balance, 0) + p_tien
   where id = p_user
     and coalesce(points, 0) >= p_diem
  returning points, balance::bigint;
end;
$$;

comment on function public.doi_diem(uuid, integer, bigint) is
  'Đổi điểm thưởng ra số dư ví — trừ điểm và cộng tiền nguyên tử, chỉ khi đủ điểm.';

-- Số tiền quy đổi do MÁY CHỦ tính từ bảng giá trong site_content, không nhận từ
-- trình duyệt → không cấp quyền gọi cho người dùng thường.
revoke all on function public.doi_diem(uuid, integer, bigint) from public, anon, authenticated;
grant execute on function public.doi_diem(uuid, integer, bigint) to service_role;
