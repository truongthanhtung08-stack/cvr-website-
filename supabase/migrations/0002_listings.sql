-- ============================================================================
-- B2 — TIN ĐĂNG: bảng `listings` + RLS + seed 33 tin mẫu (từ src/lib/data.ts)
-- Chạy SAU 0001_profiles.sql (dùng lại is_admin() và set_updated_at()).
-- Cách chạy: Supabase → SQL Editor → dán toàn bộ file → Run.
-- ============================================================================

-- 1) KIỂU LIỆT KÊ ---------------------------------------------------------------
-- Mục đích tin (2 trục taxonomy: purpose × type — type là nhãn text theo
-- src/lib/filters.ts vì danh mục còn tinh chỉnh; chuẩn hoá thành bảng sau).
create type public.listing_purpose as enum ('ban', 'thue');

-- Hạng tin CVR (bảng "Giá đăng tin + QC"): diamond > gold > silver > basic
create type public.listing_tier as enum ('diamond', 'gold', 'silver', 'basic');

-- Vòng đời tin: đăng → duyệt (AI + admin) → hiển thị → hết hạn/ẩn
create type public.listing_status as enum ('pending', 'approved', 'rejected', 'hidden', 'expired');

-- 2) BẢNG listings ----------------------------------------------------------------
create table public.listings (
  -- id dạng text: tin mẫu giữ id cũ ('1'..'33') để URL /bat-dong-san/[id] và
  -- ảnh /images/tin/N.jpg không đổi; tin mới tự sinh uuid.
  id            text primary key default gen_random_uuid()::text,
  owner_id      uuid references public.profiles(id) on delete set null, -- null = tin hệ thống/mẫu

  purpose       public.listing_purpose not null default 'ban',
  type          text not null,               -- loại hình (nhãn theo saleTypeGroups/rentTypeGroups)
  title         text not null,
  description   text,                        -- null → FE tự sinh tóm tắt (listingSummary)

  price_vnd     bigint,                      -- null = "Thỏa thuận" · thuê = đ/tháng
  area_m2       numeric,
  beds          smallint,
  baths         smallint,

  ward          text,                        -- Phường/Xã   (khớp src/lib/locations.ts)
  district      text,                        -- Quận/Huyện
  province      text not null,               -- Tỉnh/Thành
  lat           double precision,            -- bản đồ Leaflet
  lng           double precision,

  images        text[] not null default '{}', -- phần tử đầu = ảnh chính

  tier            public.listing_tier   not null default 'basic',
  tier_expires_at timestamptz,               -- hết hạn VIP → hệ thống hạ về basic
  status          public.listing_status not null default 'pending',
  published_at    timestamptz,
  expires_at      timestamptz,
  view_count      integer not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.listings is 'Tin BĐS Coastal Land — purpose × type, hạng CVR, duyệt tin';

-- Chỉ mục cho các truy vấn chính (danh sách theo mục đích, khu vực, hạng, mới nhất)
create index idx_listings_status_purpose on public.listings (status, purpose);
create index idx_listings_province       on public.listings (province);
create index idx_listings_tier           on public.listings (tier);
create index idx_listings_created_at     on public.listings (created_at desc);
create index idx_listings_owner          on public.listings (owner_id);

-- 3) Tự cập nhật updated_at (dùng lại hàm từ 0001) --------------------------------
create trigger trg_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- 4) Chặn người thường tự sửa cột đặc quyền ----------------------------------------
--    (hạng tin / trạng thái duyệt / lượt xem / chủ tin — chỉ admin hoặc hệ thống)
create or replace function public.protect_listing_privileged()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new; -- service_role / SQL Editor / admin → cho phép
  end if;

  if new.tier            is distinct from old.tier
     or new.tier_expires_at is distinct from old.tier_expires_at
     or new.status       is distinct from old.status
     or new.published_at is distinct from old.published_at
     or new.view_count   is distinct from old.view_count
     or new.owner_id     is distinct from old.owner_id then
    raise exception 'Không được sửa cột đặc quyền của tin (tier/status/view_count/owner)';
  end if;

  return new;
end;
$$;

create trigger trg_listings_protect_privileged
  before update on public.listings
  for each row execute function public.protect_listing_privileged();

-- 5) RLS ---------------------------------------------------------------------------
alter table public.listings enable row level security;

-- Đọc: ai cũng xem được tin ĐÃ DUYỆT (khách vãng lai — người mua miễn phí);
--      chủ tin xem tin của mình mọi trạng thái; admin xem tất cả.
create policy "listings_select_public_or_own" on public.listings
  for select using (
    status = 'approved' or owner_id = auth.uid() or public.is_admin()
  );

-- Thêm: thành viên đăng nhập tự đăng tin của mình (mặc định pending chờ duyệt)
create policy "listings_insert_own" on public.listings
  for insert with check ( auth.uid() is not null and owner_id = auth.uid() );

-- Sửa: chủ tin sửa tin mình (cột đặc quyền bị trigger #4 chặn); admin sửa tất cả
create policy "listings_update_own_or_admin" on public.listings
  for update using ( owner_id = auth.uid() or public.is_admin() )
           with check ( owner_id = auth.uid() or public.is_admin() );

-- Xoá: chủ tin hoặc admin
create policy "listings_delete_own_or_admin" on public.listings
  for delete using ( owner_id = auth.uid() or public.is_admin() );

-- ============================================================================
-- 6) SEED — 33 tin mẫu (khớp 1:1 src/lib/data.ts, ảnh /images/tin/N.jpg)
--    Hạng: VIP→diamond · Nổi bật→gold · Mới→silver · không huy hiệu→basic
--    Tất cả status='approved' để web hiển thị ngay. Chạy lại an toàn (on conflict).
-- ============================================================================
insert into public.listings
  (id, purpose, type, title, price_vnd, area_m2, beds, baths, ward, district, province, images, tier, status, published_at)
values
  -- Đà Nẵng (bán)
  ('1',  'ban',  'Villa / Biệt thự biển', 'Villa biển 3 tầng mặt tiền Võ Nguyên Giáp, view trực diện Mỹ Khê', 33000000000, 350, 5, 6, 'Phước Mỹ', 'Sơn Trà', 'Đà Nẵng', '{/images/tin/1.jpg}', 'diamond', 'approved', now()),
  ('2',  'ban',  'Căn hộ / Chung cư', 'Căn hộ The Filmore 2PN view sông Hàn, bàn giao cao cấp', 7200000000, 95, 2, 2, 'Hải Châu I', 'Hải Châu', 'Đà Nẵng', '{/images/tin/2.jpg}', 'gold', 'approved', now()),
  ('3',  'ban',  'Nhà phố', 'Nhà phố 4 tầng mặt tiền kinh doanh trung tâm Thanh Khê', 8500000000, 100, 4, 4, 'Tam Thuận', 'Thanh Khê', 'Đà Nẵng', '{/images/tin/3.jpg}', 'basic', 'approved', now()),
  ('4',  'ban',  'Đất nền', 'Đất nền KĐT sinh thái Hòa Xuân, sổ đỏ trao tay', 4200000000, 100, null, null, 'Hòa Xuân', 'Cẩm Lệ', 'Đà Nẵng', '{/images/tin/4.jpg}', 'silver', 'approved', now()),
  ('5',  'ban',  'Condotel', 'Condotel Wyndham Soleil full nội thất, cam kết lợi nhuận', 2800000000, 42, 1, 1, 'Thọ Quang', 'Sơn Trà', 'Đà Nẵng', '{/images/tin/5.jpg}', 'basic', 'approved', now()),
  ('6',  'ban',  'Nhà xưởng / Kho bãi', 'Nhà xưởng KCN Hòa Khánh 1.500m², sản xuất ngay', null, 1500, null, null, 'Hòa Khánh Bắc', 'Liên Chiểu', 'Đà Nẵng', '{/images/tin/6.jpg}', 'basic', 'approved', now()),
  ('7',  'ban',  'Căn hộ / Chung cư', 'Penthouse 3PN Sun Cosmo Residence view toàn cảnh biển', 13500000000, 165, 3, 3, 'Khuê Mỹ', 'Ngũ Hành Sơn', 'Đà Nẵng', '{/images/tin/7.jpg}', 'gold', 'approved', now()),
  ('8',  'ban',  'Đất công nghiệp', 'Đất công nghiệp KCN Liên Chiểu 5.000m² cho thuê dài hạn', null, 5000, null, null, 'Hòa Hiệp Bắc', 'Liên Chiểu', 'Đà Nẵng', '{/images/tin/8.jpg}', 'basic', 'approved', now()),
  ('9',  'ban',  'Villa / Biệt thự biển', 'Biệt thự sinh thái ven sông Hòa Xuân, sân vườn rộng', 12500000000, 220, 4, 4, 'Hòa Xuân', 'Cẩm Lệ', 'Đà Nẵng', '{/images/tin/9.jpg}', 'diamond', 'approved', now()),
  ('10', 'ban',  'Nhà phố', 'Shophouse khối đế dự án ven biển Ngũ Hành Sơn', 9200000000, 95, 3, 3, 'Hòa Hải', 'Ngũ Hành Sơn', 'Đà Nẵng', '{/images/tin/10.jpg}', 'basic', 'approved', now()),
  ('11', 'ban',  'Đất nền', 'Đất nền ven biển Hòa Hải, pháp lý hoàn chỉnh', 6500000000, 100, null, null, 'Hòa Hải', 'Ngũ Hành Sơn', 'Đà Nẵng', '{/images/tin/11.jpg}', 'basic', 'approved', now()),
  ('12', 'ban',  'Căn hộ / Chung cư', 'Căn hộ cao cấp 3PN trung tâm Hải Châu, full nội thất', 6800000000, 110, 3, 2, 'Thạch Thang', 'Hải Châu', 'Đà Nẵng', '{/images/tin/12.jpg}', 'diamond', 'approved', now()),
  -- Huế (bán)
  ('13', 'ban',  'Villa / Biệt thự biển', 'Biệt thự nghỉ dưỡng sân vườn ven sông Hương', 14500000000, 260, 4, 5, 'Kim Long', 'Quận Phú Xuân', 'Huế', '{/images/tin/13.jpg}', 'diamond', 'approved', now()),
  ('14', 'ban',  'Nhà phố', 'Nhà vườn cổ kính khu An Cựu, kiến trúc Huế', 5600000000, 180, 3, 2, 'An Cựu', 'Quận Thuận Hóa', 'Huế', '{/images/tin/14.jpg}', 'basic', 'approved', now()),
  ('15', 'ban',  'Đất nền', 'Đất nền KĐT mới Hương Thủy, giá đầu tư', 2100000000, 100, null, null, 'Thủy Dương', 'Hương Thủy', 'Huế', '{/images/tin/15.jpg}', 'silver', 'approved', now()),
  ('16', 'ban',  'Nhà phố', 'Nhà phố mặt tiền trung tâm TP. Huế, tiện kinh doanh', 4300000000, 95, 3, 3, 'Phú Hội', 'Quận Phú Xuân', 'Huế', '{/images/tin/16.jpg}', 'basic', 'approved', now()),
  -- Quảng Nam cũ (nay Đà Nẵng)
  ('17', 'ban',  'Đất nền', 'Đất nền ven sông Cẩm Châu, Hội An – pháp lý đầy đủ', 5400000000, 100, null, null, 'Cẩm Châu', 'Hội An', 'Đà Nẵng', '{/images/tin/17.jpg}', 'silver', 'approved', now()),
  ('18', 'ban',  'Nhà phố', 'Nhà phố 3 tầng trung tâm Tam Kỳ', 4100000000, 95, 3, 3, 'An Mỹ', 'Tam Kỳ', 'Đà Nẵng', '{/images/tin/18.jpg}', 'basic', 'approved', now()),
  ('19', 'ban',  'Villa / Biệt thự biển', 'Biệt thự nghỉ dưỡng ven biển Điện Dương, Điện Bàn', 9700000000, 200, 4, 4, 'Điện Dương', 'Điện Bàn', 'Đà Nẵng', '{/images/tin/19.jpg}', 'gold', 'approved', now()),
  -- Quảng Ngãi
  ('20', 'ban',  'Đất nền', 'Đất nền KĐT mới Nghĩa Chánh, TP. Quảng Ngãi', 1900000000, 100, null, null, 'Nghĩa Chánh', 'TP. Quảng Ngãi', 'Quảng Ngãi', '{/images/tin/20.jpg}', 'basic', 'approved', now()),
  ('21', 'ban',  'Nhà phố', 'Nhà phố mặt tiền Trần Phú, TP. Quảng Ngãi', 3300000000, 88, 3, 2, 'Trần Phú', 'TP. Quảng Ngãi', 'Quảng Ngãi', '{/images/tin/21.jpg}', 'basic', 'approved', now()),
  -- Bình Định cũ (nay Gia Lai)
  ('22', 'ban',  'Căn hộ / Chung cư', 'Căn hộ biển Quy Nhơn full nội thất, view vịnh', 2700000000, 62, 2, 2, 'Nguyễn Văn Cừ', 'TP. Quy Nhơn', 'Gia Lai', '{/images/tin/22.jpg}', 'gold', 'approved', now()),
  ('23', 'ban',  'Đất nền', 'Đất nền KĐT An Nhơn, giá đầu tư hấp dẫn', 1500000000, 100, null, null, 'Bình Định', 'An Nhơn', 'Gia Lai', '{/images/tin/23.jpg}', 'silver', 'approved', now()),
  ('24', 'ban',  'Villa / Biệt thự biển', 'Villa biển trực diện vịnh Quy Nhơn', 18900000000, 280, 5, 5, 'Ghềnh Ráng', 'TP. Quy Nhơn', 'Gia Lai', '{/images/tin/24.jpg}', 'diamond', 'approved', now()),
  -- Cho thuê (giá đ/tháng)
  ('25', 'thue', 'Căn hộ chung cư', 'Cho thuê căn hộ 2PN The Filmore view sông Hàn, full nội thất', 18000000, 95, 2, 2, 'Hải Châu I', 'Hải Châu', 'Đà Nẵng', '{/images/tin/2.jpg}', 'gold', 'approved', now()),
  ('26', 'thue', 'Căn hộ dịch vụ', 'Cho thuê căn hộ dịch vụ 1PN trung tâm Hải Châu, dọn vào ở ngay', 9000000, 45, 1, 1, 'Thạch Thang', 'Hải Châu', 'Đà Nẵng', '{/images/tin/12.jpg}', 'silver', 'approved', now()),
  ('27', 'thue', 'Nhà riêng', 'Cho thuê nhà riêng 3 tầng khu Mỹ An, gần biển Mỹ Khê', 22000000, 100, 4, 4, 'Mỹ An', 'Ngũ Hành Sơn', 'Đà Nẵng', '{/images/tin/3.jpg}', 'basic', 'approved', now()),
  ('28', 'thue', 'Nhà mặt phố', 'Cho thuê nhà mặt phố Nguyễn Văn Linh, tiện kinh doanh', 40000000, 120, 3, 3, 'Nam Dương', 'Hải Châu', 'Đà Nẵng', '{/images/tin/10.jpg}', 'diamond', 'approved', now()),
  ('29', 'thue', 'Văn phòng', 'Cho thuê văn phòng hạng B trung tâm Hải Châu, 120m² sàn thông', 28000000, 120, null, null, 'Thạch Thang', 'Hải Châu', 'Đà Nẵng', '{/images/tin/7.jpg}', 'basic', 'approved', now()),
  ('30', 'thue', 'Mặt bằng / Cửa hàng bán lẻ', 'Cho thuê mặt bằng cửa hàng phố biển Mỹ Khê, mặt tiền rộng', 45000000, 150, null, null, 'Phước Mỹ', 'Sơn Trà', 'Đà Nẵng', '{/images/tin/1.jpg}', 'gold', 'approved', now()),
  ('31', 'thue', 'Thuê đất / Nhà xưởng / Kho bãi', 'Cho thuê kho xưởng KCN Hòa Khánh 1.500m², điện 3 pha', null, 1500, null, null, 'Hòa Khánh Bắc', 'Liên Chiểu', 'Đà Nẵng', '{/images/tin/6.jpg}', 'basic', 'approved', now()),
  ('32', 'thue', 'Nhà trọ / Phòng trọ', 'Cho thuê phòng trọ cao cấp gần ĐH Duy Tân, an ninh 24/7', 4500000, 30, 1, 1, 'Khuê Mỹ', 'Ngũ Hành Sơn', 'Đà Nẵng', '{/images/tin/5.jpg}', 'basic', 'approved', now()),
  ('33', 'thue', 'Nhà riêng', 'Cho thuê nhà nguyên căn khu An Cựu, Huế — 3PN đầy đủ nội thất', 14000000, 180, 3, 2, 'An Cựu', 'Quận Thuận Hóa', 'Huế', '{/images/tin/14.jpg}', 'basic', 'approved', now())
on conflict (id) do update set
  purpose = excluded.purpose, type = excluded.type, title = excluded.title,
  price_vnd = excluded.price_vnd, area_m2 = excluded.area_m2,
  beds = excluded.beds, baths = excluded.baths,
  ward = excluded.ward, district = excluded.district, province = excluded.province,
  images = excluded.images, tier = excluded.tier, status = excluded.status;
