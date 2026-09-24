-- ============================================================================
-- 0038 — SỐ LIỆU LƯỢT XEM / HIỂN THỊ PHẢN ÁNH ĐÚNG
-- ----------------------------------------------------------------------------
-- Đo 25/09/2026 (0h10 giờ VN): máy chủ CSDL chạy giờ UTC → current_date trả
-- 24/09. Mọi lượt xem / hiển thị / người xem từ 0h tới 7h sáng giờ VN bị ghi
-- sang NGÀY HÔM TRƯỚC — biểu đồ và "hôm nay / 7 ngày" của người đăng tin lệch.
--
-- Sửa gọn nhất, không đụng thân hàm: gắn múi giờ VN riêng cho 3 hàm ghi số.
-- Trong hàm, current_date thành ngày giờ VN; phần còn lại của CSDL giữ nguyên.
--
-- Thêm: ghi_hien_thi bỏ qua tin của CHÍNH người đang xem (chủ tin lướt danh
-- sách không tự cộng lượt hiển thị cho mình) — cùng quy tắc với lượt xem tin.
-- ============================================================================

alter function public.increment_listing_view(text, text, text) set timezone = 'Asia/Ho_Chi_Minh';
alter function public.ghi_nguoi_xem(text) set timezone = 'Asia/Ho_Chi_Minh';

create or replace function public.ghi_hien_thi(p_ids text[])
returns void
language plpgsql
security definer
set search_path = public
set timezone = 'Asia/Ho_Chi_Minh'
as $$
begin
  if p_ids is null or array_length(p_ids, 1) is null then
    return;
  end if;

  insert into public.listing_impression_daily (listing_id, ngay, luot)
  select l.id, current_date, 1
    from public.listings l
   where l.id = any (p_ids[1:60])
     and l.status = 'approved'
     and l.owner_id is distinct from auth.uid()   -- chủ tin tự thấy tin mình → không tính
  on conflict (listing_id, ngay)
  do update set luot = public.listing_impression_daily.luot + 1;
end;
$$;

grant execute on function public.ghi_hien_thi(text[]) to anon, authenticated;

-- Giá trị mặc định của cột cũng theo ngày VN (phòng chỗ nào chèn không ghi ngày).
alter table public.listing_view_daily       alter column ngay set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
alter table public.listing_impression_daily alter column ngay set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
alter table public.listing_viewer           alter column ngay set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;
