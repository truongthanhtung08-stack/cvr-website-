-- ============================================================================
-- NGƯỜI XEM TIN — thành viên nào đã mở tin của tôi ra xem
-- ----------------------------------------------------------------------------
-- Trước migration này, người bán CHỈ biết được ai bấm nút "hiện số"
-- (listing_leads). Đó là nhóm rất nhỏ — phần lớn khách xem tin xong đóng lại,
-- người bán không biết gì về họ.
--
-- BỐN MỨC QUAN TÂM, hẹp dần — đúng cách các sàn lớn dựng phễu:
--   1. Hiển thị     tin được bày ra trước mắt        (listing_impression_daily)
--   2. Xem tin      có người bấm mở tin ra           (listing_view_daily)
--   3. NGƯỜI XEM    thành viên đăng nhập đã mở tin   ← bảng này
--   4. Hỏi số       chủ động bấm xem số điện thoại   (listing_leads)
--
-- Mức 3 chính là lý do để khách đăng ký tài khoản: muốn xem số thì phải đăng
-- nhập, mà đăng nhập rồi thì người bán biết ai đang quan tâm tin mình.
--
-- QUYỀN RIÊNG TƯ: bảng này chụp lại tên và số điện thoại tại thời điểm xem,
-- nhưng giao diện CHE BỚT số cho tới khi người đó tự bấm "hiện số" (thành lead
-- ở mức 4). Lộ hết số của người mới chỉ xem lướt thì người mua sẽ ngại xem — mà
-- người mua là nguồn sống của sàn.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0001_profiles.sql · 0002_listings.sql · 0022_tuong_tac_tin.sql (is_admin).
-- ============================================================================

-- 1) BẢNG NGƯỜI XEM -----------------------------------------------------------
-- MỖI NGƯỜI · MỖI TIN · MỖI NGÀY một dòng, kèm số lần xem trong ngày. Ghi từng
-- lượt thành một dòng riêng thì bảng phình rất nhanh mà chẳng nói thêm được gì.
create table if not exists public.listing_viewer (
  listing_id   text not null references public.listings(id) on delete cascade,
  viewer_id    uuid not null references public.profiles(id) on delete cascade,
  ngay         date not null default current_date,
  lan_xem      integer not null default 1,
  -- Chụp lại tên/số tại thời điểm xem: người xem đổi hồ sơ sau này cũng không
  -- làm sai lệch thứ người bán đã nhìn thấy.
  viewer_name  text,
  viewer_phone text,
  lan_cuoi     timestamptz not null default now(),
  primary key (listing_id, viewer_id, ngay)
);

comment on table public.listing_viewer is
  'Thành viên đã mở tin ra xem — mức quan tâm giữa "xem ẩn danh" và "hỏi số".';

create index if not exists idx_viewer_listing on public.listing_viewer (listing_id, lan_cuoi desc);

alter table public.listing_viewer enable row level security;

-- Đọc: CHỦ TIN xem tin mình · admin xem tất cả · và CHÍNH NGƯỜI XEM được thấy
-- dòng của mình (để sau này làm mục "tin tôi đã xem").
drop policy if exists "viewer_select_owner_or_admin" on public.listing_viewer;
create policy "viewer_select_owner_or_admin" on public.listing_viewer
  for select using (
    public.is_admin()
    or viewer_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = listing_viewer.listing_id and l.owner_id = auth.uid()
    )
  );

-- 2) GHI NGƯỜI XEM ------------------------------------------------------------
-- Chỉ ghi khi ĐÃ ĐĂNG NHẬP và tin ĐÃ DUYỆT. Người xem chính tin của mình thì
-- không ghi — xem lại tin mình đăng không phải là quan tâm.
create or replace function public.ghi_nguoi_xem(p_listing_id text)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_ten   text;
  v_sdt   text;
  v_chu   uuid;
begin
  if v_user is null then
    return;
  end if;

  select l.owner_id into v_chu
    from public.listings l
   where l.id = p_listing_id and l.status = 'approved';

  -- Tin không tồn tại / chưa duyệt / chính chủ đang xem → không ghi.
  if v_chu is null or v_chu = v_user then
    return;
  end if;

  select p.full_name, p.phone into v_ten, v_sdt
    from public.profiles p
   where p.id = v_user;

  insert into public.listing_viewer (listing_id, viewer_id, ngay, lan_xem, viewer_name, viewer_phone, lan_cuoi)
  values (p_listing_id, v_user, current_date, 1, v_ten, v_sdt, now())
  on conflict (listing_id, viewer_id, ngay)
  do update set
    lan_xem  = public.listing_viewer.lan_xem + 1,
    lan_cuoi = now(),
    -- Cập nhật lại tên/số nếu hồ sơ đã đầy đủ hơn lần trước.
    viewer_name  = coalesce(excluded.viewer_name,  public.listing_viewer.viewer_name),
    viewer_phone = coalesce(excluded.viewer_phone, public.listing_viewer.viewer_phone);
end;
$$;

comment on function public.ghi_nguoi_xem(text) is
  'Ghi nhận một thành viên đã mở tin ra xem — gọi từ trang chi tiết tin.';

-- Chỉ người đã đăng nhập mới gọi được (hàm tự đọc auth.uid, không nhận id từ ngoài).
grant execute on function public.ghi_nguoi_xem(text) to authenticated;
