-- ============================================================================
-- Thêm trạng thái 'draft' (NHÁP) cho tin đăng — lưu tin làm dở, vào tiếp không mất.
-- Tin nháp KHÔNG hiện trên web (chỉ status='approved' mới công khai).
-- Chạy trong Supabase → SQL Editor. An toàn chạy lại.
-- ============================================================================
alter type public.listing_status add value if not exists 'draft';
