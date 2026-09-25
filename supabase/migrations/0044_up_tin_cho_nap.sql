-- ============================================================================
-- 0044 — UP TIN CHỜ NẠP TIỀN (chủ dự án chốt 25/09/2026)
-- ----------------------------------------------------------------------------
-- Khách bấm Up tin mà ví thiếu → ghi YÊU CẦU vào đây, đưa khách đi nạp tiền.
-- Tiền vào ví (webhook PayOS / admin cộng tay) → máy TỰ UP ngay theo đúng hạng
-- + thời hạn khách đã chọn, giá tính lại lúc Up (đúng bảng giá lúc đó).
-- Mỗi tin chỉ có MỘT yêu cầu đang chờ; bấm lại thì thay yêu cầu cũ.
-- Yêu cầu quá 7 ngày không nạp thì bỏ (trang_thai = 'huy').
-- ============================================================================
create table if not exists public.up_cho (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  listing_id  text not null references public.listings(id) on delete cascade,
  tier        text not null,
  so_ngay     int  not null check (so_ngay > 0),
  trang_thai  text not null default 'cho' check (trang_thai in ('cho', 'xong', 'huy', 'loi')),
  ghi_chu     text,
  tao_luc     timestamptz not null default now(),
  xong_luc    timestamptz
);
create unique index if not exists up_cho_mot_tin_mot_yeu_cau on public.up_cho (listing_id) where trang_thai = 'cho';
create index if not exists idx_up_cho_user on public.up_cho (user_id, trang_thai, tao_luc);

alter table public.up_cho enable row level security;
drop policy if exists "up_cho_doc_cua_minh" on public.up_cho;
create policy "up_cho_doc_cua_minh" on public.up_cho
  for select using (user_id = auth.uid() or public.is_admin());

-- Chỉ ĐỌC qua RLS; ghi do máy chủ (service role).
revoke all on public.up_cho from anon, authenticated;
grant select on public.up_cho to authenticated;
grant all on public.up_cho to service_role;
