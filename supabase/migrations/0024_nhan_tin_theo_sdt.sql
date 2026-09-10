-- ============================================================================
-- NHẬN TIN VỀ TÀI KHOẢN — môi giới thật lấy lại tin đã được đăng hộ
--
-- Bối cảnh: rất nhiều tin trên web do chủ dự án đăng HỘ môi giới (tin thật,
-- người thật, số thật ghi trong details.contact.phone). Khi chính môi giới đó
-- lập tài khoản, tin cũ vẫn đứng tên chủ dự án → họ đăng nhập vào thấy TRỐNG
-- TRƠN, không có số liệu, không sửa được tin của chính mình.
--
-- BẰNG CHỨNG SỞ HỮU — chủ dự án chốt hai đường, không có đường thứ ba:
--   1. SỐ ĐÃ XÁC MINH → tự nhận, không cần hỏi ai.
--   2. Chưa xác minh   → gửi YÊU CẦU, chủ dự án duyệt tay trong /admin.
-- Chỉ khai trùng số mà KHÔNG xác minh thì KHÔNG được nhận — nếu không, ai khai
-- số người khác cũng chiếm được tin lẫn danh sách khách quan tâm của họ.
--
-- HAI CHỖ THỰC TẾ HAY LÀM HỎNG VIỆC KHỚP SỐ — xử lý ngay từ tầng CSDL:
--   · MỘT NGƯỜI CÓ NHIỀU SỐ: môi giới thường dùng 2 số (một số Zalo, một số gọi).
--     → bảng sdt_nguoi_dung cho phép khai thêm số, mỗi số chỉ thuộc MỘT tài khoản.
--   · MỘT Ô GHI NHIỀU SỐ: tin hay ghi "0707.435.555 / 0918.339.739" trong cùng
--     một ô. Chuẩn hoá cả ô thành một chuỗi số là sai bét → phải TÁCH ra rồi so
--     từng số một (khớp đúng cách src/lib/phone.ts làm ở phía web).
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0001_profiles.sql · 0002_listings.sql · 0022_tuong_tac_tin.sql
-- ============================================================================

-- 1) CHUẨN HOÁ SỐ ĐIỆN THOẠI ------------------------------------------------
-- Chuẩn của dự án (src/lib/phone.ts): 10 chữ số, có số 0 đứng đầu.
-- "+84 905 123 456" · "0905.123.456" · "905123456" → "0905123456".
create or replace function public.chuan_sdt(p_raw text)
returns text
language plpgsql
immutable as $$
declare
  d text;
begin
  d := regexp_replace(coalesce(p_raw, ''), '[^0-9]', '', 'g');
  if d = '' then return ''; end if;
  if left(d, 4) = '0084' then d := substr(d, 5);
  elsif left(d, 2) = '84' and length(d) >= 10 then d := substr(d, 3);
  end if;
  if left(d, 1) <> '0' then d := '0' || d; end if;
  return d;
end;
$$;

-- Một ô có thể chứa NHIỀU số: "0707.435.555 / 0918.339.739" hoặc xuống dòng.
-- Tách theo dấu ngăn cách rồi chuẩn hoá từng số; bỏ số quá ngắn (không phải SĐT).
create or replace function public.chuan_sdt_nhieu(p_raw text)
returns text[]
language plpgsql
immutable as $$
declare
  phan   text;
  ket    text[] := '{}';
  mot    text;
begin
  if coalesce(p_raw, '') = '' then return ket; end if;
  -- Ngăn cách số với số: "/", ",", ";", "-", "|", "hoặc", xuống dòng…
  for phan in
    select unnest(regexp_split_to_array(p_raw, '\s*(?:/|,|;|\||\n|hoac|hoặc|or)\s*'))
  loop
    mot := public.chuan_sdt(phan);
    if length(mot) between 9 and 11 then
      ket := array_append(ket, mot);
    end if;
  end loop;
  return ket;
end;
$$;

-- 2) SỐ ĐIỆN THOẠI CỦA NGƯỜI DÙNG (nhiều số cho một tài khoản) ---------------
-- MỖI SỐ CHỈ THUỘC MỘT TÀI KHOẢN (unique) — nếu không, hai người cùng khai một
-- số là tin nhảy qua nhảy lại giữa hai tài khoản.
create table if not exists public.sdt_nguoi_dung (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  sdt         text not null,
  da_xac_minh boolean not null default false,   -- true = được tự nhận tin bằng số này
  created_at  timestamptz not null default now(),
  unique (sdt)
);

comment on table public.sdt_nguoi_dung is
  'Các số điện thoại khác của một tài khoản (môi giới thường dùng 2 số). Mỗi số chỉ thuộc một người.';

create index if not exists idx_sdt_nd_user on public.sdt_nguoi_dung (user_id);

alter table public.sdt_nguoi_dung enable row level security;

drop policy if exists "sdt_nd_select_self_or_admin" on public.sdt_nguoi_dung;
create policy "sdt_nd_select_self_or_admin" on public.sdt_nguoi_dung
  for select using (public.is_admin() or user_id = auth.uid());

-- Tự khai thêm số cho CHÍNH MÌNH. Khai xong vẫn là chưa xác minh (mặc định false)
-- nên chưa nhận được tin — phải qua duyệt.
drop policy if exists "sdt_nd_insert_self" on public.sdt_nguoi_dung;
create policy "sdt_nd_insert_self" on public.sdt_nguoi_dung
  for insert with check (user_id = auth.uid() and da_xac_minh = false);

drop policy if exists "sdt_nd_delete_self_or_admin" on public.sdt_nguoi_dung;
create policy "sdt_nd_delete_self_or_admin" on public.sdt_nguoi_dung
  for delete using (public.is_admin() or user_id = auth.uid());

drop policy if exists "sdt_nd_update_admin" on public.sdt_nguoi_dung;
create policy "sdt_nd_update_admin" on public.sdt_nguoi_dung
  for update using (public.is_admin()) with check (public.is_admin());

-- 3) DANH SÁCH SỐ CỦA TÔI ----------------------------------------------------
-- p_chi_da_xac_minh = true → chỉ số được phép TỰ nhận tin.
create or replace function public.sdt_cua_toi(p_chi_da_xac_minh boolean default false)
returns text[]
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ds  text[] := '{}';
  v_chinh text;
  v_xm  boolean;
begin
  if v_uid is null then return v_ds; end if;

  select chuan_sdt(phone), coalesce(phone_verified, false)
    into v_chinh, v_xm
    from public.profiles where id = v_uid;

  if coalesce(v_chinh, '') <> '' and (not p_chi_da_xac_minh or v_xm) then
    v_ds := array_append(v_ds, v_chinh);
  end if;

  select coalesce(array_agg(chuan_sdt(s.sdt)), '{}')
    into v_ds
    from (
      select unnest(v_ds) as sdt
      union
      select sdt from public.sdt_nguoi_dung
       where user_id = v_uid and (not p_chi_da_xac_minh or da_xac_minh)
    ) s;

  return v_ds;
end;
$$;

grant execute on function public.sdt_cua_toi(boolean) to authenticated;

-- 4) ĐẾM TIN MANG SỐ CỦA TÔI -------------------------------------------------
-- Tin đang đứng tên NGƯỜI KHÁC nhưng ghi một trong các số của tôi.
create or replace function public.dem_tin_theo_sdt_cua_toi()
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ds  text[];
  v_dem integer;
begin
  if v_uid is null then return 0; end if;
  v_ds := public.sdt_cua_toi(false);
  if array_length(v_ds, 1) is null then return 0; end if;

  select count(*) into v_dem
    from public.listings l
   where (l.owner_id is null or l.owner_id <> v_uid)
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(l.details->'contact'->>'phone')) x
        where x = any(v_ds)
     );
  return coalesce(v_dem, 0);
end;
$$;

grant execute on function public.dem_tin_theo_sdt_cua_toi() to authenticated;

-- 5) TỰ NHẬN TIN — CHỈ VỚI SỐ ĐÃ XÁC MINH ------------------------------------
create or replace function public.tu_nhan_tin_theo_sdt()
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_ds  text[];
  v_dem integer;
begin
  if v_uid is null then raise exception 'Cần đăng nhập'; end if;

  if array_length(public.sdt_cua_toi(false), 1) is null then
    raise exception 'Hồ sơ chưa có số điện thoại';
  end if;

  v_ds := public.sdt_cua_toi(true);
  if array_length(v_ds, 1) is null then
    raise exception 'Số điện thoại chưa xác minh';
  end if;

  update public.listings
     set owner_id = v_uid
   where (owner_id is null or owner_id <> v_uid)
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(details->'contact'->>'phone')) x
        where x = any(v_ds)
     );

  get diagnostics v_dem = row_count;
  return v_dem;
end;
$$;

grant execute on function public.tu_nhan_tin_theo_sdt() to authenticated;

-- 6) YÊU CẦU NHẬN TIN (khi chưa xác minh được số) ---------------------------
create table if not exists public.yeu_cau_nhan_tin (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  ds_sdt      text[] not null default '{}',      -- TẤT CẢ số người này khai
  so_tin      integer not null default 0,
  trang_thai  text not null default 'cho_duyet', -- cho_duyet · da_duyet · tu_choi
  ghi_chu     text,
  created_at  timestamptz not null default now(),
  duyet_luc   timestamptz,
  duyet_boi   uuid references public.profiles(id) on delete set null
);

comment on table public.yeu_cau_nhan_tin is
  'Môi giới xin nhận lại tin đã được đăng hộ (khớp số điện thoại). Quản trị viên duyệt tay.';

create index if not exists idx_ycnt_trang_thai on public.yeu_cau_nhan_tin (trang_thai, created_at desc);

alter table public.yeu_cau_nhan_tin enable row level security;

drop policy if exists "ycnt_select_self_or_admin" on public.yeu_cau_nhan_tin;
create policy "ycnt_select_self_or_admin" on public.yeu_cau_nhan_tin
  for select using (public.is_admin() or user_id = auth.uid());

drop policy if exists "ycnt_insert_self" on public.yeu_cau_nhan_tin;
create policy "ycnt_insert_self" on public.yeu_cau_nhan_tin
  for insert with check (user_id = auth.uid());

drop policy if exists "ycnt_update_admin" on public.yeu_cau_nhan_tin;
create policy "ycnt_update_admin" on public.yeu_cau_nhan_tin
  for update using (public.is_admin()) with check (public.is_admin());

-- 7) ADMIN DUYỆT → CHUYỂN TIN + ĐÁNH DẤU SỐ ĐÃ XÁC MINH ---------------------
create or replace function public.duyet_nhan_tin(p_yeu_cau uuid)
returns integer
language plpgsql
security definer
set search_path = public as $$
declare
  v_uid uuid;
  v_ds  text[];
  v_dem integer;
  v_so  text;
begin
  if not public.is_admin() then
    raise exception 'Chỉ quản trị viên được duyệt';
  end if;

  select user_id, ds_sdt into v_uid, v_ds
    from public.yeu_cau_nhan_tin
   where id = p_yeu_cau and trang_thai = 'cho_duyet';

  if v_uid is null then
    raise exception 'Không tìm thấy yêu cầu đang chờ duyệt';
  end if;

  update public.listings
     set owner_id = v_uid
   where (owner_id is null or owner_id <> v_uid)
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(details->'contact'->>'phone')) x
        where x = any(v_ds)
     );
  get diagnostics v_dem = row_count;

  -- Chủ dự án đã đối chiếu và đồng ý → các số này coi như đã xác minh, lần sau
  -- người đó đăng tin/nhận tin bằng số đó không phải xin duyệt lại.
  foreach v_so in array v_ds loop
    insert into public.sdt_nguoi_dung (user_id, sdt, da_xac_minh)
    values (v_uid, v_so, true)
    on conflict (sdt) do update set user_id = excluded.user_id, da_xac_minh = true;
  end loop;

  update public.yeu_cau_nhan_tin
     set trang_thai = 'da_duyet', so_tin = v_dem, duyet_luc = now(), duyet_boi = auth.uid()
   where id = p_yeu_cau;

  return v_dem;
end;
$$;

grant execute on function public.duyet_nhan_tin(uuid) to authenticated;
