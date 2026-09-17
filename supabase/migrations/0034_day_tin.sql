-- ============================================================================
-- 0034 — ĐẨY TIN (UP): mốc đẩy riêng + nhật ký lượt đẩy
-- ----------------------------------------------------------------------------
-- Cơ chế (tài liệu "Cơ chế hiển thị và thuật toán BĐS", mục 4):
--   · Phương thức 1 — Position Pinning: vị trí đầu thuộc về nhóm VIP (làm ở
--     tầng sắp xếp, không cần cột nào).
--   · Phương thức 2 — tài liệu gọi là "Dynamic Timestamp Refresh", tức SỬA
--     THẲNG ngày đăng cho tin trông như mới.
--
-- ⛔ COASTAL LAND KHÔNG LÀM KIỂU ĐÓ. Chủ dự án đã chốt: KHÔNG giả ngày đăng.
--    Thay vào đó dùng CỘT RIÊNG `bumped_at`:
--      · `published_at` = ngày đăng THẬT, không bao giờ bị sửa → khách luôn
--        đọc được tin này thực sự rao từ bao giờ (giữ niềm tin người mua).
--      · `bumped_at`    = lần đẩy gần nhất, CHỈ dùng để xếp thứ tự.
--    Người mua thấy sự thật, người bán vẫn mua được chỗ đứng. Hai việc khác nhau.
--
-- Idempotent — chạy lại bao nhiêu lần cũng được.
-- ============================================================================

-- 1. Mốc đẩy trên chính tin đăng ------------------------------------------------
alter table public.listings
  add column if not exists bumped_at timestamptz;

comment on column public.listings.bumped_at is
  'Lần ĐẨY TIN gần nhất. Chỉ dùng để SẮP XẾP; ngày đăng thật nằm ở published_at và không bao giờ bị sửa.';

-- Tin cũ chưa từng đẩy: lấy mốc lên sóng làm mốc xuất phát để thứ tự không đổi
-- so với hiện tại (nếu để NULL thì mọi tin cũ tụt xuống cuối ngay khi đổi sort).
update public.listings
   set bumped_at = coalesce(published_at, created_at)
 where bumped_at is null;

-- Sắp xếp trang danh sách chạy trên cột này → cần index.
create index if not exists listings_bumped_at_idx
  on public.listings (bumped_at desc nulls last);

-- 2. Nhật ký lượt đẩy ----------------------------------------------------------
-- Có thu tiền thì phải có sổ: khách hỏi "tôi đã đẩy mấy lần, mất bao nhiêu"
-- là trả lời được, và đây cũng là căn cứ chặn đẩy quá 1 lượt/ngày.
create table if not exists public.listing_bumps (
  id          uuid primary key default gen_random_uuid(),
  listing_id  text not null references public.listings(id) on delete cascade,  -- listings.id là TEXT (tin mẫu giữ id cũ "1".."33"), không phải uuid
  user_id     uuid references public.profiles(id) on delete set null,
  tien        bigint not null default 0,    -- số tiền ĐÃ TRỪ VÍ (đã gồm GTGT) — bigint cho khớp profiles.balance
  ngay        date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  created_at  timestamptz not null default now()
);

-- MỖI TIN CHỈ ĐẨY 1 LẦN/NGÀY — đúng mô tả gói ("nhiều lần đẩy trong nhiều
-- ngày, mỗi ngày 1 lần"). Chặn bằng ràng buộc CSDL chứ không chỉ bằng giao
-- diện: bấm nhanh hai lần, hai tab, hay gọi thẳng API đều không lách được.
create unique index if not exists listing_bumps_moi_ngay_idx
  on public.listing_bumps (listing_id, ngay);

create index if not exists listing_bumps_user_idx
  on public.listing_bumps (user_id, created_at desc);

alter table public.listing_bumps enable row level security;

-- Chủ tin đọc được lịch sử đẩy của chính mình; admin đọc tất.
drop policy if exists "chu tin doc luot day" on public.listing_bumps;
create policy "chu tin doc luot day" on public.listing_bumps
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.listings l where l.id = listing_bumps.listing_id and l.owner_id = auth.uid())
    -- Dùng lại is_admin() như policy của listing_leads (0022) thay vì so
    -- profiles.role = 'admin': role là kiểu enum public.user_role, so bằng
    -- chuỗi là chỗ dễ vỡ.
    or public.is_admin()
  );

-- KHÔNG mở policy insert cho người dùng: việc ghi do máy chủ làm bằng khoá
-- service_role sau khi đã trừ ví. Khách tự insert được là đẩy tin miễn phí.

-- 3. SỔ DOANH THU: cho phép một tin có NHIỀU khoản thu -------------------------
-- `uq_doanh_thu_listing` (0017) chặn mỗi tin chỉ MỘT dòng doanh thu — đúng cho
-- tiền đăng tin (chống trừ hai lần khi bấm Duyệt hai lần), nhưng sẽ chặn luôn
-- tiền ĐẨY TIN của chính tin đó: một tin đẩy 10 lần là 10 khoản thu thật, phải
-- vào sổ đủ 10, nếu không tờ khai thuế thiếu.
--
-- Nới ĐÚNG CHỖ: thêm cột phân loại, và ràng buộc cũ chỉ còn áp cho khoản đăng
-- tin. Lá chắn chống trừ hai lần giữ nguyên hiệu lực.
alter table public.doanh_thu
  add column if not exists loai text not null default 'dang_tin';

comment on column public.doanh_thu.loai is
  'dang_tin = tiền gói đăng tin (mỗi tin một khoản) · day_tin = tiền mỗi lượt đẩy (một tin nhiều khoản)';

drop index if exists uq_doanh_thu_listing;
create unique index if not exists uq_doanh_thu_listing
  on public.doanh_thu (listing_id)
  where listing_id is not null and loai = 'dang_tin';

-- 4. ĐẨY TIN NGUYÊN TỬ ---------------------------------------------------------
-- Gộp ba việc vào MỘT giao dịch: trừ ví → ghi nhật ký → cập nhật mốc đẩy.
-- Tách rời ba bước thì mất tiền mà tin không lên, hoặc tin lên mà không trừ tiền.
-- Trả về dòng kết quả khi thành công, KHÔNG trả dòng nào khi không đủ điều kiện.
create or replace function public.day_tin(
  p_listing text,
  p_user    uuid,
  p_tien    bigint
)
-- Tên cột trả về KHÔNG được trùng `bumped_at`: trong thân hàm có câu
-- `update listings set bumped_at = ...`, trùng tên là Postgres báo "column
-- reference is ambiguous" và hàm chết ngay lần đẩy đầu tiên.
returns table (so_du bigint, moc_day timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_so_du bigint;
begin
  -- Chỉ đẩy được tin CỦA MÌNH và ĐANG ĐĂNG.
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user and status = 'approved'
  ) then
    return;
  end if;

  -- Giành suất đẩy của ngày hôm nay. Trùng ngày → unique index chặn → thoát,
  -- KHÔNG trừ tiền.
  begin
    insert into listing_bumps (listing_id, user_id, tien, ngay)
    values (p_listing, p_user, p_tien, v_ngay);
  exception when unique_violation then
    return;
  end;

  -- Trừ ví, và chỉ trừ khi đủ tiền.
  update profiles
     set balance = balance - p_tien
   where id = p_user and balance >= p_tien
  returning balance into v_so_du;

  if not found then
    raise exception 'VI_KHONG_DU';   -- huỷ cả giao dịch, nhật ký cũng không còn
  end if;

  update listings set bumped_at = now() where id = p_listing;

  return query select v_so_du, (select l.bumped_at from listings l where l.id = p_listing);
end;
$$;

revoke all on function public.day_tin(text, uuid, bigint) from public, anon, authenticated;

-- Nạp lại schema cho PostgREST để web thấy cột/bảng/hàm mới NGAY.
notify pgrst, 'reload schema';

-- KIỂM CHỨNG — chạy xong phải thấy đủ 4 dòng true.
select 'cot bumped_at'  as muc, exists (select 1 from information_schema.columns where table_name='listings'   and column_name='bumped_at') as co
union all select 'bang listing_bumps', exists (select 1 from information_schema.tables  where table_name='listing_bumps')
union all select 'cot doanh_thu.loai', exists (select 1 from information_schema.columns where table_name='doanh_thu' and column_name='loai')
union all select 'ham day_tin',        exists (select 1 from pg_proc where proname='day_tin');
