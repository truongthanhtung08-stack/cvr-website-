-- ============================================================================
-- SỔ SỰ CỐ — LỖI NGUY HIỂM PHẢI GÀO LÊN, KHÔNG ĐƯỢC NẰM IM
-- ----------------------------------------------------------------------------
-- VÌ SAO CÓ BẢNG NÀY: web đang nuốt lỗi ở đúng những chỗ chết người, chỉ ghi
-- console.error rồi đi tiếp — mà console của Vercel thì không ai ngồi canh:
--   · Đã TRỪ TIỀN khách nhưng ghi sổ doanh thu hỏng → tờ khai thuế thiếu tiền.
--   · PayOS báo có tiền về nhưng không tìm ra đơn gốc → khách mất tiền, ví vẫn 0.
--   · Token Zalo OA làm mới hỏng → toàn bộ mã OTP chết, KHÁCH KHÔNG ĐĂNG NHẬP ĐƯỢC.
--   · Gửi thư/ZNS báo khách hỏng → khách không biết tin đã lên sóng.
-- Mỗi cái đều im lặng và đều mất tiền hoặc mất khách.
--
-- HAI ĐƯỜNG BÁO, phòng khi một đường chết:
--   1. Email ngay cho ADMIN_EMAIL (đường chính).
--   2. Ghi vào bảng này → hiện đỏ ngay trang /admin (dùng khi chính email hỏng).
--
-- Chạy trong Supabase → SQL Editor → dán toàn bộ → Run. AN TOÀN CHẠY LẠI.
-- ============================================================================

create table if not exists public.su_co (
  id          uuid primary key default gen_random_uuid(),
  xay_ra_luc  timestamptz not null default now(),

  -- Khoá gộp: các lần hỏng CÙNG một nguyên nhân dùng chung khoá, để email không
  -- bắn liên tục khi một thứ hỏng hàng loạt (vd Zalo sập thì mọi tin ZNS đều hỏng).
  khoa        text not null,
  noi         text not null,               -- nơi xảy ra: duyet-tin · payos-webhook · zalo-oa…

  -- chet = mất tiền hoặc khách không dùng được web · nang = sai lệch dữ liệu · nhe = phiền
  muc_do      text not null default 'nang' check (muc_do in ('chet', 'nang', 'nhe')),

  tom_tat     text not null,               -- một câu tiếng Việt, đọc là hiểu
  chi_tiet    text,                        -- lỗi thô của máy, để tra cứu
  hau_qua     text,                        -- không sửa thì mất gì
  can_lam     text,                        -- việc phải làm tay để cứu

  bao_luc     timestamptz,                 -- lần cuối gửi được email (null = chưa báo)
  da_xu_ly    boolean not null default false,
  xu_ly_luc   timestamptz
);

comment on table public.su_co is
  'Sự cố hệ thống — lỗi nguy hiểm bị nuốt trong code, ghi lại để báo email + hiện đỏ ở /admin.';

-- Danh sách ở /admin luôn xem lỗi mới nhất trước.
create index if not exists idx_su_co_moi on public.su_co (xay_ra_luc desc);
-- Chặn email trùng: tìm nhanh lần báo gần nhất của cùng một khoá.
create index if not exists idx_su_co_khoa on public.su_co (khoa, xay_ra_luc desc);

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Nội dung lỗi có thể lộ cấu trúc bên trong → CHỈ admin đọc được.
-- Máy chủ ghi bằng service_role nên không cần policy insert cho người thường.
alter table public.su_co enable row level security;
drop policy if exists "su_co_admin" on public.su_co;
create policy "su_co_admin" on public.su_co
  for all using ( public.is_admin() ) with check ( public.is_admin() );
