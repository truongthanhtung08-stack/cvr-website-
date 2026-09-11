-- ============================================================================
-- ĐÁNH GIÁ CHẤT LƯỢNG TIN — hỏi đúng người vừa liên hệ
-- ----------------------------------------------------------------------------
-- Người vừa bấm xem số là người DUY NHẤT biết tin đó thật hay ảo, giá đúng hay
-- sai, môi giới có nghe máy không. Hỏi họ là cách rẻ nhất và đúng nhất để lọc
-- tin ảo — thứ khách ghét nhất ở mọi sàn.
--
-- HỎI NGAY TRÊN WEB, không gửi ZNS: mỗi tin ZNS là tiền, mà khách vừa xem số
-- xong vẫn đang ở trên trang, hỏi lúc đó họ còn nhớ rõ nhất.
--
-- Việc này càng quan trọng khi chạy quảng cáo trả tiền theo click: khách tốn
-- tiền click vào mà gặp tin ảo là mất luôn, nên tin ảo phải bị lọc TRƯỚC khi
-- đốt tiền quảng cáo.
--
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại (idempotent).
-- Cần: 0002_listings.sql · 0001_profiles.sql (is_admin).
-- ============================================================================

create table if not exists public.danh_gia_tin (
  id           uuid primary key default gen_random_uuid(),
  listing_id   text not null references public.listings(id) on delete cascade,
  -- Người đánh giá: có tài khoản thì ghi id, khách qua OTP thì ghi số đã xác thực.
  nguoi_id     uuid references public.profiles(id) on delete set null,
  nguoi_sdt    text,
  sao          smallint not null check (sao between 1 and 5),
  -- Ba vấn đề hay gặp nhất, tick nhanh — không bắt khách gõ chữ.
  sai_thong_tin  boolean not null default false,   -- tin không đúng mô tả
  khong_lien_lac boolean not null default false,   -- gọi không ai nghe
  da_ban         boolean not null default false,   -- tin đã bán/cho thuê rồi
  ghi_chu      text,
  created_at   timestamptz not null default now()
);

comment on table public.danh_gia_tin is
  'Đánh giá chất lượng tin từ người đã liên hệ — nguồn để lọc tin ảo và xếp hạng.';

create index if not exists idx_danh_gia_listing on public.danh_gia_tin (listing_id, created_at desc);

-- MỖI NGƯỜI ĐÁNH GIÁ MỘT TIN MỘT LẦN. Không chặn thì một người bấm mấy chục lần
-- là dìm được tin của đối thủ.
create unique index if not exists uq_danh_gia_nguoi
  on public.danh_gia_tin (listing_id, coalesce(nguoi_id::text, nguoi_sdt));

alter table public.danh_gia_tin enable row level security;

-- Đọc: CHỦ TIN xem đánh giá tin mình · admin xem tất cả · người đánh giá xem lại
-- đánh giá của chính mình. Người ngoài KHÔNG đọc được — đánh giá kèm số điện
-- thoại, không phải thứ để bày ra ngoài.
drop policy if exists "danh_gia_select" on public.danh_gia_tin;
create policy "danh_gia_select" on public.danh_gia_tin
  for select using (
    public.is_admin()
    or nguoi_id = auth.uid()
    or exists (
      select 1 from public.listings l
      where l.id = danh_gia_tin.listing_id and l.owner_id = auth.uid()
    )
  );

-- Ghi: qua hàm bên dưới, không mở policy INSERT cho ai cả.

-- ── GỬI ĐÁNH GIÁ ────────────────────────────────────────────────────────────
-- CHỈ người ĐÃ THẬT SỰ LIÊN HỆ tin mới đánh giá được: phải có tên trong
-- listing_leads. Không có chốt này thì ai cũng vào dìm sao tin người khác.
create or replace function public.gui_danh_gia(
  p_listing_id text,
  p_sao        smallint,
  p_sdt        text default null,
  p_sai        boolean default false,
  p_khong_gap  boolean default false,
  p_da_ban     boolean default false,
  p_ghi_chu    text default null
)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_sdt  text := nullif(trim(p_sdt), '');
  v_co   boolean;
begin
  if p_sao is null or p_sao < 1 or p_sao > 5 then
    raise exception 'So sao phai tu 1 den 5';
  end if;
  if v_user is null and v_sdt is null then
    raise exception 'Chua xac dinh duoc nguoi danh gia';
  end if;

  -- Đã liên hệ tin này chưa?
  select exists (
    select 1 from public.listing_leads l
     where l.listing_id = p_listing_id
       and ((v_user is not null and l.viewer_id = v_user)
         or (v_sdt  is not null and l.viewer_phone = v_sdt))
  ) into v_co;

  if not v_co then
    raise exception 'Chi nguoi da lien he tin nay moi danh gia duoc';
  end if;

  insert into public.danh_gia_tin
    (listing_id, nguoi_id, nguoi_sdt, sao, sai_thong_tin, khong_lien_lac, da_ban, ghi_chu)
  values
    (p_listing_id, v_user, v_sdt, p_sao, coalesce(p_sai, false),
     coalesce(p_khong_gap, false), coalesce(p_da_ban, false), nullif(trim(p_ghi_chu), ''))
  -- Đánh giá lại thì GHI ĐÈ cái cũ, không thêm dòng mới.
  on conflict (listing_id, coalesce(nguoi_id::text, nguoi_sdt))
  do update set
    sao            = excluded.sao,
    sai_thong_tin  = excluded.sai_thong_tin,
    khong_lien_lac = excluded.khong_lien_lac,
    da_ban         = excluded.da_ban,
    ghi_chu        = coalesce(excluded.ghi_chu, public.danh_gia_tin.ghi_chu),
    created_at     = now();
end;
$$;

comment on function public.gui_danh_gia(text, smallint, text, boolean, boolean, boolean, text) is
  'Gửi đánh giá chất lượng tin — chỉ người đã liên hệ tin đó mới gọi được.';

grant execute on function public.gui_danh_gia(text, smallint, text, boolean, boolean, boolean, text)
  to anon, authenticated;
