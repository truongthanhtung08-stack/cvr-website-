-- ============================================================================
-- 0015 — HỘP THƯ YÊU CẦU CỦA KHÁCH (dùng chung cho MỌI loại yêu cầu)
-- ----------------------------------------------------------------------------
-- Khách chỉ để lại: TÊN · SỐ ĐIỆN THOẠI · EMAIL (không bắt buộc) · NỘI DUNG.
-- Quản trị viên đọc ở /admin/yeu-cau và xử lý. Riêng yêu cầu "đăng dự án",
-- bấm Duyệt là mở luôn quyền đăng dự án cho tài khoản đó.
-- Cách chạy: Supabase → SQL Editor → dán file → Run.
-- ============================================================================

create table if not exists public.customer_requests (
  id          uuid primary key default gen_random_uuid(),
  -- Khách chưa đăng nhập vẫn gửi được → cho phép NULL
  user_id     uuid references public.profiles(id) on delete set null,

  loai        text not null default 'khac',   -- dang_du_an | ho_tro | hop_tac | khac
  ten         text not null,
  dien_thoai  text not null,
  email       text,
  noi_dung    text,

  status      text not null default 'moi',    -- moi | dang_xu_ly | xong | tu_choi
  admin_note  text,
  xu_ly_boi   uuid references public.profiles(id) on delete set null,
  xu_ly_luc   timestamptz,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.customer_requests is
  'Yêu cầu khách gửi từ web — mọi loại. Quản trị viên xử lý ở /admin/yeu-cau';

create index if not exists idx_yc_status on public.customer_requests (status, created_at desc);
create index if not exists idx_yc_loai   on public.customer_requests (loai, created_at desc);
create index if not exists idx_yc_user   on public.customer_requests (user_id);

drop trigger if exists set_yc_updated_at on public.customer_requests;
create trigger set_yc_updated_at
  before update on public.customer_requests
  for each row execute function public.set_updated_at();

-- RLS -------------------------------------------------------------------------
alter table public.customer_requests enable row level security;

-- AI CŨNG GỬI ĐƯỢC (kể cả khách chưa đăng nhập) — đây là ô liên hệ công khai
drop policy if exists yc_insert_all on public.customer_requests;
create policy yc_insert_all on public.customer_requests
  for insert with check ( true );

-- Chỉ chủ của yêu cầu và quản trị viên được xem
drop policy if exists yc_select_own_or_admin on public.customer_requests;
create policy yc_select_own_or_admin on public.customer_requests
  for select using ( public.is_admin() or (user_id is not null and auth.uid() = user_id) );

drop policy if exists yc_update_admin on public.customer_requests;
create policy yc_update_admin on public.customer_requests
  for update using ( public.is_admin() ) with check ( public.is_admin() );

drop policy if exists yc_delete_admin on public.customer_requests;
create policy yc_delete_admin on public.customer_requests
  for delete using ( public.is_admin() );

-- Chuyển các yêu cầu đã gửi ở bảng cũ sang (nếu có) — chạy lại nhiều lần cũng
-- không bị trùng. Bảng cũ project_poster_requests từ nay KHÔNG dùng nữa.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'project_poster_requests') then
    insert into public.customer_requests (id, user_id, loai, ten, dien_thoai, noi_dung, status, admin_note, created_at)
    select r.id,
           r.user_id,
           'dang_du_an',
           coalesce(nullif(r.contact_name, ''), 'Khách hàng'),
           coalesce(nullif(r.contact_phone, ''), '—'),
           concat_ws(E'\n',
             nullif(concat('Dự án: ', r.project_name), 'Dự án: '),
             nullif(concat('Công ty: ', r.company_name), 'Công ty: '),
             r.note),
           case r.status when 'da_duyet' then 'xong' when 'tu_choi' then 'tu_choi' else 'moi' end,
           r.admin_note,
           r.created_at
    from public.project_poster_requests r
    where not exists (select 1 from public.customer_requests c where c.id = r.id);
  end if;
end $$;
