-- ============================================================================
-- TƯƠNG TÁC TIN — "biết ai vào xem tin" + cổng số điện thoại
-- Slice A của đợt nâng cấp: đếm lượt xem THẬT + ghi LEAD (ai bấm hiện số).
--   1) increment_listing_view(id)  — đếm lượt xem ẩn danh (anon gọi được)
--   2) listing_leads               — bảng lead: người ĐÃ ĐĂNG NHẬP bấm "hiện số"
--   3) reveal_contact(id)          — trả full SĐT + ghi lead (chỉ khi đăng nhập)
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0001_profiles.sql (is_admin) + 0002_listings.sql (bảng listings, view_count).
-- ============================================================================

-- 1) ĐẾM LƯỢT XEM THẬT ------------------------------------------------------------
-- Cột view_count đã có (0002) nhưng RLS/trigger chặn người thường tự sửa. Hàm này
-- chạy security definer → cộng 1 an toàn cho tin ĐÃ DUYỆT. Khách vãng lai (anon)
-- cũng đếm được — người mua miễn phí, không cần đăng nhập chỉ để được tính là 1 lượt.
create or replace function public.increment_listing_view(p_listing_id text)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  update public.listings
     set view_count = view_count + 1
   where id = p_listing_id and status = 'approved';
end;
$$;

grant execute on function public.increment_listing_view(text) to anon, authenticated;

-- 2) BẢNG LEAD — AI QUAN TÂM TIN ---------------------------------------------------
-- Mỗi dòng = một người ĐÃ ĐĂNG NHẬP đã bấm "hiện số" ở một tin. Đây chính là
-- "biết ai vào xem tin" mà người bán nhận được: tên + SĐT người quan tâm.
create table if not exists public.listing_leads (
  id           uuid primary key default gen_random_uuid(),
  listing_id   text not null references public.listings(id) on delete cascade,
  viewer_id    uuid references public.profiles(id) on delete set null,
  viewer_name  text,   -- chụp lại tên lúc bấm (profiles đổi tên sau không ảnh hưởng lead cũ)
  viewer_phone text,   -- SĐT người quan tâm — để người bán chủ động gọi lại
  created_at   timestamptz not null default now()
);

create index if not exists idx_leads_listing on public.listing_leads (listing_id, created_at desc);
create index if not exists idx_leads_viewer  on public.listing_leads (viewer_id);

comment on table public.listing_leads is
  'Lead tin BĐS — người đăng nhập bấm "hiện số"; chủ tin xem được ai quan tâm.';

alter table public.listing_leads enable row level security;

-- Đọc: CHỦ TIN xem lead của tin mình; admin xem tất cả. Người khác không thấy gì.
-- (Không có policy INSERT cho người thường — lead chỉ được tạo qua RPC bên dưới.)
drop policy if exists "leads_select_owner_or_admin" on public.listing_leads;
create policy "leads_select_owner_or_admin" on public.listing_leads
  for select using (
    public.is_admin() or exists (
      select 1 from public.listings l
      where l.id = listing_leads.listing_id and l.owner_id = auth.uid()
    )
  );

-- 3) HIỆN SỐ + GHI LEAD ------------------------------------------------------------
-- Chỉ NGƯỜI ĐÃ ĐĂNG NHẬP mới gọi được. Trả full SĐT của người đăng (lấy từ
-- details.contact.phone) VÀ ghi một lead. Chống trùng: cùng người + cùng tin trong
-- 1 ngày chỉ ghi 1 lead (khách bấm lại nhiều lần không thổi phồng danh sách).
create or replace function public.reveal_contact(p_listing_id text)
returns text
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_phone text;
  v_name  text;
  v_vphone text;
begin
  if v_uid is null then
    raise exception 'Cần đăng nhập để xem số điện thoại';
  end if;

  select details->'contact'->>'phone'
    into v_phone
    from public.listings
   where id = p_listing_id and status = 'approved';

  if v_phone is null or btrim(v_phone) = '' then
    return null; -- tin chưa có số → không có gì để hiện, cũng không ghi lead
  end if;

  select full_name, phone into v_name, v_vphone
    from public.profiles where id = v_uid;

  insert into public.listing_leads (listing_id, viewer_id, viewer_name, viewer_phone)
  select p_listing_id, v_uid, v_name, v_vphone
   where not exists (
     select 1 from public.listing_leads
      where listing_id = p_listing_id
        and viewer_id  = v_uid
        and created_at > now() - interval '1 day'
   );

  return v_phone;
end;
$$;

grant execute on function public.reveal_contact(text) to authenticated;
