-- ============================================================================
-- KHO CẤT CHUỖI BÍ MẬT DO MÁY CHỦ TỰ GIỮ
-- ----------------------------------------------------------------------------
-- VÌ SAO PHẢI CÓ BẢNG RIÊNG: bảng `site_content` ĐỌC ĐƯỢC CÔNG KHAI — đúng như
-- thiết kế, vì nó chứa nội dung hiển thị trên web (hero, footer, bảng giá...).
-- Đã kiểm chứng: gọi REST bằng khoá ẩn danh vẫn liệt kê được toàn bộ khoá.
--
-- Nên TUYỆT ĐỐI không cất chuỗi bí mật ở đó. Refresh token Zalo OA mà nằm trong
-- site_content thì bất kỳ ai trên mạng cũng đọc được và gửi tin ZNS thay mặt OA
-- Coastal Land — vừa mất tiền, vừa có thể bị Zalo khoá OA vì spam.
--
-- Bảng này chỉ máy chủ (service_role) và admin đọc được.
--
-- Đang dùng cho:
--   zalo_oa_token — { access_token, refresh_token, het_han_luc }
--                   lib/zaloOa.ts tự đọc/ghi, tự làm mới mỗi giờ.
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

create table if not exists public.bi_mat (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

comment on table public.bi_mat is
  'Chuỗi bí mật do máy chủ tự giữ (vd refresh token Zalo OA). KHÔNG bao giờ để ở site_content vì bảng đó công khai.';

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Không có policy nào cho người dùng thường → khách không đọc được dòng nào.
-- service_role bỏ qua RLS nên máy chủ vẫn đọc/ghi bình thường.
alter table public.bi_mat enable row level security;
drop policy if exists "bi_mat_admin" on public.bi_mat;
create policy "bi_mat_admin" on public.bi_mat
  for all using ( public.is_admin() ) with check ( public.is_admin() );

-- Dọn sạch nếu bản cũ đã lỡ ghi token vào site_content.
delete from public.site_content where key = 'zalo_oa_token';
