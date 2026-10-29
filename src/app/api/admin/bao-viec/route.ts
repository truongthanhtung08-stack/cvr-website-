import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { baoAdmin, type KhoiBao } from "@/lib/baoAdmin";
import { kiemTin } from "@/lib/kiemTin";
import { baoLoi } from "@/lib/baoLoi";

// ============================================================================
// EMAIL VIỆC CẦN ADMIN XỬ LÝ — cron mỗi giờ (vercel.json "2 * * * *").
// Chủ dự án chốt 02/10/2026: CHỈ gửi khi CÓ VIỆC phải làm (duyệt, trục trặc),
// không gửi báo cáo thống kê. Gửi về email công ty (src/lib/baoAdmin.ts).
//   · Mỗi giờ: việc MỚI phát sinh trong giờ vừa qua — tin chờ duyệt, tin khách vừa sửa
//     (chờ kiểm), dự án / hồ sơ dự án chờ duyệt, yêu cầu khách. Không có gì → không gửi.
//     Quét theo khung giờ tròn [giờ trước, giờ này) nên mỗi việc báo đúng 1 lần, và bắt
//     được mọi đường tạo việc (form khách, đăng lại, nhập hàng loạt, Mini App).
//   · 8h sáng: Tự kiểm tin (src/lib/kiemTin.ts) — có lỗi mới gửi.
//   · Sự cố hệ thống (tiền, đăng nhập, Zalo…) vẫn đi đường riêng baoLoi, báo ngay.
// Gom theo giờ để giữ hạn mức Resend (100 thư/ngày dùng chung với OTP của khách).
// ============================================================================
export const dynamic = "force-dynamic";

const GIO = 3_600_000;
const dem = (n: number | null | undefined) => n ?? 0;

export async function GET(request: Request) {
  const khoaCron = process.env.CRON_SECRET;
  if (khoaCron && request.headers.get("authorization") !== `Bearer ${khoaCron}`) {
    return NextResponse.json({ ok: false, message: "Không có quyền" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, message: "Thiếu SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const den = new Date(Math.floor(Date.now() / GIO) * GIO).toISOString(); // đầu giờ này
  const tu = new Date(Date.parse(den) - GIO).toISOString(); // đầu giờ trước
  const khoi: KhoiBao[] = [];

  try {
    const [tinCho, tinSua, duAn, hoSo, yeuCau, tongCho] = await Promise.all([
      admin.from("listings").select("id,title").eq("status", "pending").gte("updated_at", tu).lt("updated_at", den),
      admin.from("listings").select("id,title").eq("status", "approved").gte("details->>da_sua_luc", tu).lt("details->>da_sua_luc", den),
      admin.from("projects").select("id,name").eq("status", "pending").gte("updated_at", tu).lt("updated_at", den),
      admin.from("project_poster_requests").select("id,company_name,project_name").gte("created_at", tu).lt("created_at", den),
      admin.from("customer_requests").select("id,ten,dien_thoai,noi_dung").gte("created_at", tu).lt("created_at", den),
      admin.from("listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const ten = (s: string | null | undefined) => (s ?? "").slice(0, 70) || "(không tiêu đề)";
    const tin = (tinCho.data ?? []) as { id: string; title: string | null }[];
    if (tin.length)
      khoi.push({
        tieuDe: `${tin.length} tin mới chờ duyệt (tổng đang chờ: ${dem(tongCho.count)})`,
        dong: tin.map((t) => `${t.id.slice(0, 8).toUpperCase()} · ${ten(t.title)}`),
        link: "/admin/tin-dang",
        nhanLink: "Mở mục Chờ duyệt",
      });
    const sua = (tinSua.data ?? []) as { id: string; title: string | null }[];
    if (sua.length)
      khoi.push({
        tieuDe: `${sua.length} tin khách vừa sửa — chờ kiểm`,
        dong: sua.map((t) => `${t.id.slice(0, 8).toUpperCase()} · ${ten(t.title)}`),
        link: "/admin/tin-dang",
        nhanLink: "Mở mục Đã sửa — chờ kiểm",
      });
    const da = (duAn.data ?? []) as { name: string | null }[];
    if (da.length) khoi.push({ tieuDe: `${da.length} dự án chờ duyệt`, dong: da.map((d) => ten(d.name)), link: "/admin/du-an" });
    const hs = (hoSo.data ?? []) as { company_name: string | null; project_name: string | null }[];
    if (hs.length)
      khoi.push({
        tieuDe: `${hs.length} hồ sơ đăng dự án chờ duyệt`,
        dong: hs.map((h) => `${ten(h.company_name)}${h.project_name ? ` · ${h.project_name}` : ""}`),
        link: "/admin/du-an",
      });
    const yc = (yeuCau.data ?? []) as { ten: string | null; dien_thoai: string | null; noi_dung: string | null }[];
    if (yc.length)
      khoi.push({
        tieuDe: `${yc.length} yêu cầu khách mới`,
        dong: yc.map((y) => `${y.ten || "(không tên)"} · ${y.dien_thoai || "—"} · ${(y.noi_dung ?? "").slice(0, 80)}`),
        link: "/admin/yeu-cau",
      });

    // 8h sáng giờ VN (cron chạy phút 2 của giờ 1 UTC): rà toàn bộ tin, có lỗi mới báo.
    if (new Date().getUTCHours() === 1) {
      const kq = await kiemTin(admin);
      if (kq.loi.length)
        khoi.push({
          tieuDe: `Tự kiểm tin: ${kq.loi.length} lỗi cần sửa`,
          dong: kq.loi.slice(0, 20).map((m) => `${m.loai} · ${m.ma} · ${m.tieuDe}`),
          link: "/admin/tin-dang",
          nhanLink: "Mở Tin đăng → Tự kiểm tin",
        });
    }
  } catch (e) {
    await baoLoi({ noi: "bao-viec-admin", mucDo: "nhe", tomTat: "Quét việc cần báo admin bị lỗi", chiTiet: String(e) });
    return NextResponse.json({ ok: false, message: String(e) }, { status: 500 });
  }

  if (!khoi.length) return NextResponse.json({ ok: true, guiEmail: false });
  const chuDe = khoi.length === 1 ? khoi[0].tieuDe : `${khoi.length} việc cần xử lý`;
  const daGui = await baoAdmin(chuDe, khoi);
  return NextResponse.json({ ok: true, guiEmail: daGui, viec: khoi.map((k) => k.tieuDe) });
}
