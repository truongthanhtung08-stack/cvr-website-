-- ============================================================================
-- 0040 — GÓI HỘI VIÊN (chốt 25/09/2026, cơ chế theo Batdongsan, làm GỌN MỘT HỆ)
-- ----------------------------------------------------------------------------
--   · Chưa mua gói = thành viên thường. Mua gói 1 / 3 / 6 tháng = hội viên.
--   · Quyền lợi = VOUCHER cấp mỗi 30 ngày, hạn dùng 30 ngày (như BĐS):
--       tin-thuong  giảm X đ / lần đăng tin thường
--       tin-vip     giảm X đ / lần đăng tin VIP
--       day-thuong  giảm X đ / lần đẩy tin thường
--   · Voucher TRỪ THẲNG vào giá lúc thu tiền → doanh thu & hoá đơn = số khách
--     THỰC TRẢ. Không sinh ra "tiền khuyến mãi" nào trong ví.
--   · Quyền lợi CHỤP LẠI lúc mua (cột voucher): admin sửa gói về sau không làm
--     thay đổi gói khách đã mua.
--   · Mọi số tiền CHƯA GTGT (giống listings.gia_chua_thue, doanh_thu.tien_hang).
-- ============================================================================

create table if not exists public.hoi_vien (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  goi         text not null,                 -- mã gói: co-ban / tieu-chuan / cao-cap
  ten_goi     text not null,
  so_thang    int  not null check (so_thang > 0),
  bat_dau     timestamptz not null default now(),
  het_han     timestamptz not null,
  voucher     jsonb not null default '[]'::jsonb,  -- [{loai, giam, soLuong}] mỗi 30 ngày
  quyen_loi   jsonb not null default '[]'::jsonb,  -- các dòng quyền lợi khác (chữ)
  tong_tra    bigint not null default 0,           -- khách đã trả (gồm GTGT)
  created_at  timestamptz not null default now()
);
create index if not exists idx_hoi_vien_user on public.hoi_vien (user_id, het_han desc);

create table if not exists public.hoi_vien_voucher (
  id           bigint generated always as identity primary key,
  hoi_vien_id  bigint not null references public.hoi_vien(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  loai         text not null check (loai in ('tin-thuong', 'tin-vip', 'day-thuong')),
  giam         bigint not null check (giam >= 0),   -- CHƯA GTGT
  so_luong     int not null check (so_luong >= 0),
  con_lai      int not null check (con_lai >= 0),
  tu           timestamptz not null,
  den          timestamptz not null,
  unique (hoi_vien_id, loai, tu)
);
create index if not exists idx_hv_voucher_user on public.hoi_vien_voucher (user_id, loai, den);

alter table public.hoi_vien enable row level security;
alter table public.hoi_vien_voucher enable row level security;

drop policy if exists "hoi_vien_doc_cua_minh" on public.hoi_vien;
create policy "hoi_vien_doc_cua_minh" on public.hoi_vien
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "hv_voucher_doc_cua_minh" on public.hoi_vien_voucher;
create policy "hv_voucher_doc_cua_minh" on public.hoi_vien_voucher
  for select using (user_id = auth.uid() or public.is_admin());

-- Chỉ ĐỌC qua RLS; mọi ghi đi qua hàm bên dưới (service role).
revoke all on public.hoi_vien, public.hoi_vien_voucher from anon, authenticated;
grant select on public.hoi_vien, public.hoi_vien_voucher to authenticated;
grant all on public.hoi_vien, public.hoi_vien_voucher to service_role;

-- ── CẤP VOUCHER CỦA KỲ 30 NGÀY HIỆN TẠI (lười: gọi lúc cần, không cần lịch) ──
create or replace function public.cap_voucher_hoi_vien(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  r    record;
  v_k  int;
  v_tu timestamptz;
begin
  -- Khách chỉ được tự cấp cho CHÍNH MÌNH; service role (auth.uid() null) cấp cho ai cũng được.
  if auth.uid() is not null and auth.uid() <> p_user then
    raise exception 'Không được cấp voucher cho người khác';
  end if;

  for r in
    select * from public.hoi_vien
     where user_id = p_user and bat_dau <= now() and het_han > now()
  loop
    v_k  := floor(extract(epoch from (now() - r.bat_dau)) / (30 * 86400))::int;
    v_tu := r.bat_dau + make_interval(days => v_k * 30);
    insert into public.hoi_vien_voucher (hoi_vien_id, user_id, loai, giam, so_luong, con_lai, tu, den)
    select r.id, p_user, e->>'loai', (e->>'giam')::bigint, (e->>'soLuong')::int, (e->>'soLuong')::int,
           v_tu, least(v_tu + interval '30 days', r.het_han)
      from jsonb_array_elements(r.voucher) e
     where (e->>'soLuong')::int > 0 and (e->>'giam')::bigint > 0
    on conflict (hoi_vien_id, loai, tu) do nothing;
  end loop;
end;
$$;
revoke all on function public.cap_voucher_hoi_vien(uuid) from public, anon;
grant execute on function public.cap_voucher_hoi_vien(uuid) to authenticated, service_role;

-- ── DÙNG MỘT VOUCHER (nguyên tử; chỉ máy chủ gọi lúc thu tiền) ──────────────
-- Lấy voucher sắp hết hạn trước; nhiều cái cùng hạn thì lấy mức giảm lớn nhất.
create or replace function public.dung_voucher(p_user uuid, p_loai text)
returns table (id bigint, giam bigint)
language plpgsql
security definer
set search_path = public as $$
begin
  perform public.cap_voucher_hoi_vien(p_user);
  return query
  update public.hoi_vien_voucher v
     set con_lai = v.con_lai - 1
   where v.id = (
     select x.id from public.hoi_vien_voucher x
      where x.user_id = p_user and x.loai = p_loai and x.con_lai > 0
        and x.tu <= now() and x.den > now()
      order by x.den asc, x.giam desc
      limit 1
      for update skip locked
   )
  returning v.id, v.giam;
end;
$$;
revoke all on function public.dung_voucher(uuid, text) from public, anon, authenticated;
grant execute on function public.dung_voucher(uuid, text) to service_role;

-- Trả lại voucher khi lần thu tiền đó KHÔNG thành (ví thiếu, lỗi…).
create or replace function public.hoan_voucher(p_id bigint)
returns void
language sql
security definer
set search_path = public as $$
  update public.hoi_vien_voucher set con_lai = least(so_luong, con_lai + 1) where id = p_id;
$$;
revoke all on function public.hoan_voucher(bigint) from public, anon, authenticated;
grant execute on function public.hoan_voucher(bigint) to service_role;

-- ── MUA GÓI (nguyên tử: khoá hồ sơ → chưa có gói đang chạy → đủ tiền → trừ → tạo) ──
create or replace function public.tao_hoi_vien(
  p_user      uuid,
  p_goi       text,
  p_ten_goi   text,
  p_so_thang  int,
  p_voucher   jsonb,
  p_quyen_loi jsonb,
  p_tong_tra  bigint
)
returns table (hoi_vien_id bigint, so_du bigint, het_han timestamptz)
language plpgsql
security definer
set search_path = public as $$
declare
  v_du  bigint;
  v_id  bigint;
  v_het timestamptz := now() + make_interval(days => p_so_thang * 30);
begin
  if p_tong_tra <= 0 or p_so_thang <= 0 then
    raise exception 'Giá hoặc thời hạn gói không hợp lệ';
  end if;

  select coalesce(balance, 0)::bigint into v_du from public.profiles where id = p_user for update;
  if not found then raise exception 'Không tìm thấy tài khoản'; end if;

  if exists (select 1 from public.hoi_vien h where h.user_id = p_user and h.het_han > now()) then
    raise exception 'DANG_CO_GOI';
  end if;
  if v_du < p_tong_tra then
    raise exception 'VI_KHONG_DU';
  end if;

  update public.profiles set balance = coalesce(balance, 0) - p_tong_tra where id = p_user;

  insert into public.hoi_vien (user_id, goi, ten_goi, so_thang, het_han, voucher, quyen_loi, tong_tra)
  values (p_user, p_goi, p_ten_goi, p_so_thang, v_het, coalesce(p_voucher, '[]'::jsonb), coalesce(p_quyen_loi, '[]'::jsonb), p_tong_tra)
  returning id into v_id;

  perform public.cap_voucher_hoi_vien(p_user);

  return query select v_id, v_du - p_tong_tra, v_het;
end;
$$;
revoke all on function public.tao_hoi_vien(uuid, text, text, int, jsonb, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.tao_hoi_vien(uuid, text, text, int, jsonb, jsonb, bigint) to service_role;
