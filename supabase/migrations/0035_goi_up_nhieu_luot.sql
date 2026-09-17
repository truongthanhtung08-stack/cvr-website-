-- ============================================================================
-- 0035 — GÓI UP NHIỀU LƯỢT (Up 3 / 7 / 13 / 27 lần)
-- ----------------------------------------------------------------------------
-- Khác gì với "Đẩy tin" ở 0034:
--   · 0034 "Up ngay"  = mua LẺ từng lượt, bấm là trừ ví ngay.
--   · 0035 "Gói UP"   = mua SỈ nhiều lượt (rẻ hơn 20–50%), trả tiền MỘT LẦN,
--                        sau đó mỗi ngày tiêu 1 lượt trong kho.
--
-- LƯỢT GẮN VỚI TIN, không gắn tài khoản: bảng giá tính theo CẤP TIN (đẩy tin
-- Diamond 90.000đ, tin thường 5.000đ). Để lượt dùng chung cả tài khoản thì
-- khách mua lượt giá tin thường rồi đem đẩy tin Diamond — thủng giá.
--
-- LƯỢT KHÔNG HẾT HẠN theo gói tin (chủ dự án chốt 17/09/2026): thu tiền rồi mà
-- nuốt lượt khi tin hết hạn là mất khách. Tin đăng lại thì tiêu tiếp.
--
-- TỰ ĐỘNG ĐẨY vào KHUNG GIỜ VÀNG — chủ dự án chốt: đầu giờ sáng (8h), ưu tiên
-- ngày cuối tuần. Cron gọi /api/tin-dang/day-tu-dong lúc 8h giờ VN.
--
-- listings.id là TEXT (tin mẫu giữ id cũ "1".."33"), tiền là BIGINT cho khớp
-- profiles.balance — đã đo trên CSDL thật, không đoán.
--
-- Idempotent — chạy lại bao nhiêu lần cũng được.
-- ============================================================================

-- 1. Kho lượt trên chính tin đăng ----------------------------------------------
alter table public.listings
  add column if not exists bump_credits integer not null default 0;

alter table public.listings
  add column if not exists bump_auto boolean not null default true;

-- 'hang_ngay' = còn lượt thì ngày nào cũng đẩy lúc 8h
-- 'cuoi_tuan' = chỉ đẩy Thứ 7 và Chủ nhật — dồn lượt vào ngày đông người xem
alter table public.listings
  add column if not exists bump_lich text not null default 'hang_ngay';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'listings_bump_lich_check'
  ) then
    alter table public.listings
      add constraint listings_bump_lich_check
      check (bump_lich in ('hang_ngay', 'cuoi_tuan'));
  end if;
end $$;

comment on column public.listings.bump_credits is
  'Số lượt ĐẨY TIN còn lại trong kho của tin này (mua theo gói Up 3/7/13/27 lần).';
comment on column public.listings.bump_auto is
  'true = hệ thống tự đẩy vào khung giờ vàng cho tới khi hết lượt; false = khách tự bấm.';
comment on column public.listings.bump_lich is
  'hang_ngay | cuoi_tuan — lịch tự đẩy khi bump_auto bật.';

-- Cron quét "tin còn lượt + bật tự động" mỗi sáng → cần index.
create index if not exists listings_bump_tu_dong_idx
  on public.listings (bump_auto, bump_credits)
  where bump_credits > 0;

-- 2. MUA GÓI LƯỢT --------------------------------------------------------------
-- Trừ ví và cộng lượt trong MỘT giao dịch: tách ra là có lúc mất tiền mà không
-- được lượt. Trả về dòng kết quả khi thành công, không trả dòng nào khi hỏng.
create or replace function public.mua_goi_up(
  p_listing text,
  p_user    uuid,
  p_so_luot integer,
  p_tien    bigint
)
returns table (so_du bigint, con_lai integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_so_du  bigint;
  v_con_lai integer;
begin
  if p_so_luot <= 0 then
    return;
  end if;

  -- Chỉ mua được cho tin CỦA MÌNH và ĐANG ĐĂNG.
  if not exists (
    select 1 from listings
     where id = p_listing and owner_id = p_user and status = 'approved'
  ) then
    return;
  end if;

  -- Trừ ví, và chỉ trừ khi đủ tiền.
  update profiles
     set balance = balance - p_tien
   where id = p_user and balance >= p_tien
  returning balance into v_so_du;

  if not found then
    raise exception 'VI_KHONG_DU';
  end if;

  update listings
     set bump_credits = bump_credits + p_so_luot
   where id = p_listing
  returning bump_credits into v_con_lai;

  return query select v_so_du, v_con_lai;
end;
$$;

revoke all on function public.mua_goi_up(text, uuid, integer, bigint) from public, anon, authenticated;

-- 3. TIÊU MỘT LƯỢT TRONG KHO ---------------------------------------------------
-- Dùng cho cả hai đường: khách tự bấm Đẩy khi còn lượt, và cron tự đẩy buổi
-- sáng. KHÔNG trừ ví (tiền đã thu lúc mua gói), nhưng vẫn phải:
--   · chặn 1 lượt/ngày bằng chính unique index của listing_bumps (0034)
--   · chỉ trừ kho khi thật sự giành được suất của ngày hôm đó
-- Ghi tien = 0 vào nhật ký vì lượt này đã trả tiền từ trước, không phải khoản
-- thu mới — ghi tiền lần nữa là tính doanh thu hai lần.
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

  -- Giành suất đẩy của hôm nay. Trùng ngày → thoát, KHÔNG tiêu lượt.
  begin
    insert into listing_bumps (listing_id, user_id, tien, ngay)
    values (p_listing, p_user, 0, v_ngay);
  exception when unique_violation then
    return;
  end;

  update listings
     set bump_credits = bump_credits - 1,
         bumped_at    = now()
   where id = p_listing and bump_credits > 0
  returning bump_credits into v_con_lai;

  if not found then
    raise exception 'HET_LUOT';   -- huỷ cả giao dịch, nhật ký cũng không còn
  end if;

  return query select v_con_lai, (select l.bumped_at from listings l where l.id = p_listing);
end;
$$;

revoke all on function public.day_tin_bang_luot(text, uuid) from public, anon, authenticated;

-- Nạp lại schema cho PostgREST để web thấy cột/hàm mới NGAY.
notify pgrst, 'reload schema';

-- KIỂM CHỨNG — chạy xong phải thấy đủ 5 dòng true.
select 'cot bump_credits'   as muc, exists (select 1 from information_schema.columns where table_name='listings' and column_name='bump_credits') as co
union all select 'cot bump_auto',   exists (select 1 from information_schema.columns where table_name='listings' and column_name='bump_auto')
union all select 'cot bump_lich',   exists (select 1 from information_schema.columns where table_name='listings' and column_name='bump_lich')
union all select 'ham mua_goi_up',  exists (select 1 from pg_proc where proname='mua_goi_up')
union all select 'ham day_tin_bang_luot', exists (select 1 from pg_proc where proname='day_tin_bang_luot');
