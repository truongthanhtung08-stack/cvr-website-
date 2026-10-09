-- ============================================================================
-- 0061 — THÍCH · BÌNH LUẬN TỪNG ẢNH / VIDEO CỦA TIN (chủ dự án 10/10/2026)
-- ----------------------------------------------------------------------------
-- "Mỗi hình ảnh hay video khi mở lên phía dưới có 3 nút like, comment, share — như mạng
--  xã hội; link dữ liệu vào admin Khách hàng để biết ai like, ai bình luận."
--   · anh_so  — thứ tự ảnh/video trong tin (video đứng trước, rồi ảnh); -1 = cả tin
--   · loai    — 'thich' | 'binh_luan'
-- Ai cũng XEM được số thích + bình luận; chỉ thành viên ĐĂNG NHẬP mới thích / bình luận,
-- và chỉ xoá được của chính mình.
-- ============================================================================
create table if not exists public.tuong_tac_tin (
  id bigserial primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  anh_so int not null default -1,
  user_id uuid not null references auth.users(id) on delete cascade,
  loai text not null check (loai in ('thich', 'binh_luan')),
  noi_dung text check (noi_dung is null or char_length(noi_dung) <= 1000),
  created_at timestamptz not null default now()
);

-- Một người thích một ảnh đúng một lần
create unique index if not exists tuong_tac_tin_thich_mot_lan
  on public.tuong_tac_tin (listing_id, anh_so, user_id) where loai = 'thich';
create index if not exists tuong_tac_tin_theo_tin on public.tuong_tac_tin (listing_id, anh_so);
create index if not exists tuong_tac_tin_theo_nguoi on public.tuong_tac_tin (user_id, created_at desc);

alter table public.tuong_tac_tin enable row level security;

drop policy if exists "ai cung xem tuong tac" on public.tuong_tac_tin;
create policy "ai cung xem tuong tac" on public.tuong_tac_tin for select using (true);

drop policy if exists "thanh vien them tuong tac cua minh" on public.tuong_tac_tin;
create policy "thanh vien them tuong tac cua minh" on public.tuong_tac_tin
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "thanh vien xoa tuong tac cua minh" on public.tuong_tac_tin;
create policy "thanh vien xoa tuong tac cua minh" on public.tuong_tac_tin
  for delete to authenticated using (auth.uid() = user_id);

-- Bảng mới phải GRANT rõ (Supabase từ 30/10/2026)
grant select on public.tuong_tac_tin to anon;
grant select, insert, delete on public.tuong_tac_tin to authenticated;
grant all on public.tuong_tac_tin to service_role;
grant usage, select on sequence public.tuong_tac_tin_id_seq to authenticated, service_role;
