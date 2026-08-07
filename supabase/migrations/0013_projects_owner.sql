-- ============================================================================
-- 0013 — KHÁCH HÀNG (Chủ đầu tư / Công ty phân phối) TỰ ĐĂNG DỰ ÁN
-- ----------------------------------------------------------------------------
-- Chạy SAU 0012_project_poster.sql.
-- Khách được duyệt (profiles.can_post_project = true) tự đăng dự án như admin,
-- nhưng dự án vào trạng thái CHỜ DUYỆT — quản trị viên bấm đăng thì mới lên web.
-- Cách chạy: Supabase → SQL Editor → dán file → Run.
-- ============================================================================

-- 1) Dự án thuộc về ai --------------------------------------------------------
alter table public.projects
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

comment on column public.projects.owner_id is
  'Chủ đầu tư/đơn vị phân phối đã đăng dự án này. NULL = dự án do admin tạo.';

create index if not exists idx_projects_owner on public.projects (owner_id);

-- 2) Trạng thái CHỜ DUYỆT ------------------------------------------------------
-- Enum content_status đang có 'draft' | 'published'. Thêm 'pending' để phân biệt
-- "khách đã gửi, chờ duyệt" với "nháp của admin".
do $$
begin
  if not exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'content_status' and e.enumlabel = 'pending'
  ) then
    alter type public.content_status add value 'pending';
  end if;
end $$;

-- 3) RLS -----------------------------------------------------------------------
-- Đọc: dự án đã đăng ai cũng xem được · chủ dự án xem được dự án của chính mình
drop policy if exists "projects_select_published_or_admin" on public.projects;
create policy "projects_select_published_or_admin" on public.projects
  for select using (
    status = 'published' or public.is_admin() or auth.uid() = owner_id
  );

-- Thêm mới: phải là người ĐÃ ĐƯỢC DUYỆT quyền đăng dự án, và chỉ đăng cho chính mình.
-- KHÔNG cho tự đặt status = 'published' (phải qua quản trị viên).
drop policy if exists "projects_insert_owner" on public.projects;
create policy "projects_insert_owner" on public.projects
  for insert with check (
    public.is_admin()
    or (
      auth.uid() = owner_id
      and status <> 'published'
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.can_post_project = true
      )
    )
  );

-- Sửa: admin sửa tất cả · chủ dự án sửa dự án của mình nhưng không tự đăng công khai
drop policy if exists "projects_update_owner" on public.projects;
create policy "projects_update_owner" on public.projects
  for update using ( public.is_admin() or auth.uid() = owner_id )
  with check ( public.is_admin() or (auth.uid() = owner_id and status <> 'published') );

-- Xoá: admin, hoặc chủ dự án xoá dự án chưa đăng của mình
drop policy if exists "projects_delete_owner" on public.projects;
create policy "projects_delete_owner" on public.projects
  for delete using (
    public.is_admin() or (auth.uid() = owner_id and status <> 'published')
  );

-- Bỏ policy cũ chỉ-admin (đã được thay bằng 4 policy ở trên)
drop policy if exists "projects_write_admin" on public.projects;
