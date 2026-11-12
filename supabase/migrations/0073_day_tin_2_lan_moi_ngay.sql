-- ============================================================================
-- 0073 — ĐẨY TIN TỐI ĐA 2 LẦN MỖI NGÀY (anh 12/11/2026: "không chỉ giới hạn 1 ngày 1 lần — 1 ngày 2 lần")
-- Trước: unique (listing_id, ngay) → mỗi tin 1 lần/ngày. Nay: thêm cột `lan` (1 · 2), unique (listing_id, ngay, lan).
-- Hai hàm đẩy (trả tiền day_tin · dùng lượt gói day_tin_bang_luot) giành suất lần 1, hết thì lần 2; đủ 2 thì thoát,
-- KHÔNG trừ tiền / lượt (như cũ). Đổi số lần: sửa số 2 ở hai vòng lặp dưới + LUOT_MOI_NGAY (src/lib/luotUp.ts).
-- Chạy trong Supabase → SQL Editor. Chạy lại nhiều lần không hỏng.
-- ============================================================================

alter table public.listing_bumps add column if not exists lan smallint not null default 1;
drop index if exists public.listing_bumps_moi_ngay_idx;
create unique index if not exists listing_bumps_moi_ngay_lan_idx on public.listing_bumps (listing_id, ngay, lan);

-- 1. ĐẨY TRẢ TIỀN (bản 0056 — giữ nguyên, chỉ đổi phần giành suất)
create or replace function public.day_tin(p_listing text, p_user uuid, p_tien bigint)
returns table(so_du bigint, moc_day timestamp with time zone) language plpgsql security definer set search_path to 'public' as $function$
declare
  v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_so_du bigint;
begin
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user and status = 'approved'
  ) then
    return;
  end if;
  -- Giành suất lần 1, hết thì lần 2 trong ngày; đủ 2 lần → thoát, KHÔNG trừ tiền
  for v_lan in 1..2 loop
    begin
      insert into listing_bumps (listing_id, user_id, tien, ngay, lan)
      values (p_listing, p_user, p_tien, v_ngay, v_lan);
      exit;
    exception when unique_violation then
      if v_lan = 2 then return; end if;
    end;
  end loop;
  update profiles
     set balance = balance - p_tien
   where id = p_user and balance - public.tien_tam_giu(p_user) >= p_tien
  returning balance into v_so_du;
  if not found then
    raise exception 'VI_KHONG_DU';
  end if;
  update listings set bumped_at = now() where id = p_listing;
  return query select v_so_du, (select l.bumped_at from listings l where l.id = p_listing);
end;
$function$;

revoke all on function public.day_tin(text, uuid, bigint) from public, anon, authenticated;

-- 2. TIÊU MỘT LƯỢT TRONG KHO (bản 0035 — giữ nguyên, chỉ đổi phần giành suất)
create or replace function public.day_tin_bang_luot(
  p_listing text,
  p_user    uuid
)
returns table (con_lai integer, moc_day timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ngay date := (now() at time zone 'Asia/Ho_Chi_Minh')::date;
  v_con_lai integer;
begin
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user
       and status = 'approved' and bump_credits > 0
  ) then
    return;
  end if;

  -- Giành suất lần 1, hết thì lần 2 trong ngày; đủ 2 lần → thoát, KHÔNG tiêu lượt
  for v_lan in 1..2 loop
    begin
      insert into listing_bumps (listing_id, user_id, tien, ngay, lan)
      values (p_listing, p_user, 0, v_ngay, v_lan);
      exit;
    exception when unique_violation then
      if v_lan = 2 then return; end if;
    end;
  end loop;

  update listings
     set bump_credits = bump_credits - 1,
         bumped_at    = now()
   where id = p_listing and bump_credits > 0
  returning bump_credits into v_con_lai;

  if not found then
    raise exception 'HET_LUOT';
  end if;

  return query select v_con_lai, (select l.bumped_at from listings l where l.id = p_listing);
end;
$$;

revoke all on function public.day_tin_bang_luot(text, uuid) from public, anon, authenticated;

notify pgrst, 'reload schema';

-- KIỂM CHỨNG — chạy xong phải thấy 3 dòng true.
select 'cot lan' as muc, exists (select 1 from information_schema.columns where table_name='listing_bumps' and column_name='lan') as co
union all select 'chi muc 2 lan/ngay', exists (select 1 from pg_indexes where indexname='listing_bumps_moi_ngay_lan_idx')
union all select 'bo chi muc 1 lan/ngay', not exists (select 1 from pg_indexes where indexname='listing_bumps_moi_ngay_idx');
