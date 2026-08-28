-- ============================================================================
-- DOANH THU DỊCH VỤ DOANH NGHIỆP (B2B) — NHẬP TAY
-- ----------------------------------------------------------------------------
-- Trước đây sổ doanh thu CHỈ ghi được tiền bán gói tin đăng, vì web tự ghi lúc
-- admin duyệt tin. Khoản thu ngoài tin đăng — banner quảng cáo, bài PR, hợp
-- đồng dịch vụ với doanh nghiệp — không có đường nào vào sổ, nên bị THIẾU trên
-- tờ khai GTGT. Chủ dự án chốt 28/08/2026: mảng doanh nghiệp là mảng quan
-- trọng sắp tới và LUÔN có hóa đơn VAT, phải dựng khung sẵn từ bây giờ.
--
-- Bảng doanh_thu vốn đã nhận được dòng nhập tay (listing_id cho phép rỗng, ràng
-- buộc chống trùng chỉ áp khi listing_id khác rỗng, admin có quyền ghi). Ở đây
-- chỉ thêm CỘT PHÂN NGUỒN để báo cáo tách được hai dòng doanh thu.
--
-- Dòng nhập tay đi tiếp vào đúng luồng cũ: để hoa_don_trang_thai = 'chua_xuat'
-- thì nó tự hiện ở mục "Hóa đơn chờ phát hành" cuối ngày như mọi giao dịch khác.
--
-- ⚠️ ĐÍNH CHÍNH ghi chú sai ở migration 0017 (dòng 157-158): hóa đơn nước ngoài
--    KHÔNG phải là "không khấu trừ được GTGT". Nhà cung cấp chưa đăng ký thuế
--    tại VN thì mình khai nộp thay và chứng từ nộp thuế đó ĐƯỢC khấu trừ
--    (Nghị định 181/2025/NĐ-CP). Xem bảng hoa_don_ngoai ở migration 0018.
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

alter table public.doanh_thu
  add column if not exists nguon text not null default 'tin_dang';

-- Đặt ràng buộc rời để chạy lại không lỗi "constraint already exists".
alter table public.doanh_thu drop constraint if exists doanh_thu_nguon_check;
alter table public.doanh_thu
  add constraint doanh_thu_nguon_check
  check (nguon in ('tin_dang', 'doanh_nghiep'));

comment on column public.doanh_thu.nguon is
  'tin_dang = web tự ghi khi duyệt tin · doanh_nghiep = dịch vụ B2B nhập tay ở /admin/hoa-don-thue';

-- Báo cáo quý luôn tách hai dòng doanh thu → lọc theo nguồn trong khoảng ngày.
create index if not exists idx_doanh_thu_nguon
  on public.doanh_thu (nguon, ngay_ghi_nhan);
