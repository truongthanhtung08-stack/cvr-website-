-- ============================================================================
-- 0055 — TÌM KIẾM ĐÃ LƯU (Smart Search mục 7 · chủ dự án duyệt 02/10/2026)
-- ----------------------------------------------------------------------------
-- Khách lọc tin trên /mua-ban, /cho-thue → bấm "Nhận tin mới" → lưu đúng bộ lọc
-- (chuỗi tham số URL y hệt trang web). Cron 8h sáng (/api/thong-bao/dinh-ky) lọc
-- lại bằng chính filtersFromParams + applyFilters của web, có tin MỚI ĐĂNG khớp từ
-- lần báo trước thì báo khách 1 lần. bao_luc = mốc đã báo tới.
-- Mỗi khách tối đa 10 bộ lọc (chặn ở CSDL, không chỉ ở giao diện).
-- ============================================================================

create table if not exists public.tim_kiem_luu (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  muc_dich text not null check (muc_dich in ('ban', 'thue')),
  tham_so text not null default '',
  ten text not null default '',
  bao_luc timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tim_kiem_luu_user on public.tim_kiem_luu(user_id);

alter table public.tim_kiem_luu enable row level security;

drop policy if exists "tkl_xem_cua_minh" on public.tim_kiem_luu;
create policy "tkl_xem_cua_minh" on public.tim_kiem_luu for select using (auth.uid() = user_id);
drop policy if exists "tkl_them_cua_minh" on public.tim_kiem_luu;
create policy "tkl_them_cua_minh" on public.tim_kiem_luu for insert with check (auth.uid() = user_id);
drop policy if exists "tkl_xoa_cua_minh" on public.tim_kiem_luu;
create policy "tkl_xoa_cua_minh" on public.tim_kiem_luu for delete using (auth.uid() = user_id);

-- Tối đa 10 bộ lọc / khách.
create or replace function public.tim_kiem_luu_toi_da()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if (select count(*) from public.tim_kiem_luu where user_id = new.user_id) >= 10 then
    raise exception 'Mỗi tài khoản lưu tối đa 10 tìm kiếm';
  end if;
  return new;
end $$;
drop trigger if exists trg_tim_kiem_luu_toi_da on public.tim_kiem_luu;
create trigger trg_tim_kiem_luu_toi_da before insert on public.tim_kiem_luu
  for each row execute function public.tim_kiem_luu_toi_da();

-- Bảng MỚI phải GRANT (Supabase từ 30/10/2026).
grant select, insert, delete on public.tim_kiem_luu to authenticated;
grant all on public.tim_kiem_luu to service_role;
