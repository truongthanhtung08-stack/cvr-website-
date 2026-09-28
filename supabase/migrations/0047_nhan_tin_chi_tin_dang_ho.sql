-- ============================================================================
-- 0047 — "TIN TỰ VỀ TÀI KHOẢN" CHỈ LẤY TIN ĐĂNG HỘ (CHƯA CÓ CHỦ)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt 28/09/2026: THÀNH VIÊN = TÀI KHOẢN. Số liên hệ ghi trong tin là
-- quyền của người đăng (ghi số ai cũng được) — KHÔNG liên quan tới tài khoản.
--
-- Lỗi của bản 0024: điều kiện `owner_id is null OR owner_id <> tôi` → thành viên A
-- xác minh số X là lấy luôn TIN CỦA THÀNH VIÊN KHÁC có ghi số liên hệ X (vd môi giới
-- B đăng tin ghi số chủ nhà A → tin của B bị chuyển sang A). Nay chỉ lấy tin
-- `owner_id is null` = tin Coastal Land đăng hộ, chưa thuộc thành viên nào.
--
-- Chỉ thay 3 hàm, không đổi bảng/cột. An toàn chạy lại.
-- ============================================================================

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
   where l.owner_id is null
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(l.details->'contact'->>'phone')) x
        where x = any(v_ds)
     );
  return coalesce(v_dem, 0);
end;
$$;
grant execute on function public.dem_tin_theo_sdt_cua_toi() to authenticated;

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
   where owner_id is null
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(details->'contact'->>'phone')) x
        where x = any(v_ds)
     );

  get diagnostics v_dem = row_count;
  return v_dem;
end;
$$;
grant execute on function public.tu_nhan_tin_theo_sdt() to authenticated;

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
   where owner_id is null
     and exists (
       select 1 from unnest(public.chuan_sdt_nhieu(details->'contact'->>'phone')) x
        where x = any(v_ds)
     );
  get diagnostics v_dem = row_count;

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
