-- ============================================================================
-- KHO ẢNH tin đăng (Supabase Storage) — bucket công khai `listings`
-- Cho phép: ai cũng XEM ảnh; thành viên đăng nhập TẢI LÊN / XOÁ ảnh.
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================

-- 1) Tạo bucket công khai (đọc ảnh không cần đăng nhập — để hiển thị trên web)
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do update set public = true;

-- 2) RLS trên storage.objects — chỉ áp cho bucket 'listings'
--    (Đọc: mọi người · Ghi/Sửa/Xoá: thành viên đăng nhập)
drop policy if exists "listings_img_read"   on storage.objects;
drop policy if exists "listings_img_insert" on storage.objects;
drop policy if exists "listings_img_update" on storage.objects;
drop policy if exists "listings_img_delete" on storage.objects;

create policy "listings_img_read" on storage.objects
  for select using ( bucket_id = 'listings' );

create policy "listings_img_insert" on storage.objects
  for insert with check ( bucket_id = 'listings' and auth.role() = 'authenticated' );

create policy "listings_img_update" on storage.objects
  for update using ( bucket_id = 'listings' and auth.role() = 'authenticated' );

create policy "listings_img_delete" on storage.objects
  for delete using ( bucket_id = 'listings' and auth.role() = 'authenticated' );
