import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { baoAdmin, type KhoiBao } from "@/lib/baoAdmin";
import { baoLoi } from "@/lib/baoLoi";
import { SU_CO, EMAIL, VIEC, kemSo } from "@/lib/chuThongBao";

// ============================================================================
// EMAIL VIỆC CẦN ADMIN XỬ LÝ — cron mỗi giờ (vercel.json "2 * * * *").
// Chủ dự án chốt 02/10/2026: CHỈ gửi khi CÓ VIỆC phải làm (duyệt, trục trặc),
// không gửi báo cáo thống kê. Gửi về email công ty (src/lib/baoAdmin.ts).
//   · Mỗi giờ: việc MỚI phát sinh trong giờ vừa qua — tin chờ duyệt, tin khách vừa sửa
//     (chờ kiểm), dự án / hồ sơ dự án chờ duyệt, yêu cầu khách. Không có gì → không gửi.
//     Quét theo khung giờ tròn [giờ trước, giờ này) nên mỗi việc báo đúng 1 lần, và bắt
//     được mọi đường tạo việc (form khách, đăng lại, nhập hàng loạt, Mini App).
//   · CHỈ việc liên quan KHÁCH HÀNG (chủ dự án 31/10/2026). Việc nội bộ — tin/dự án nạp hàng loạt, Tự kiểm tin, sự cố
//     không đụng khách — không email, chỉ hiện ở Admin → Tổng quan.
//   · Sự cố đụng khách (tiền, đăng nhập, Zalo…) vẫn đi đường riêng baoLoi (khach: true), báo ngay.
// Gom theo giờ để giữ hạn mức Resend (100 thư/ngày dùng chung với OTP của khách).
// ============================================================================
export const dynamic = "force-dynamic";

const GIO = 3_600_000;


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
  let tinMoi: { id: string; title: string | null }[] = [];
  let idsDaBao: string[] | null = null;

  try {
    const [tinCho, duAn, hoSo, yeuCau, tongCho] = await Promise.all([
      admin.from("listings").select("id,title").eq("status", "pending").gte("updated_at", tu).lt("updated_at", den),
      // Ghi chú: khách sửa tin đang chờ duyệt làm đổi updated_at → lọc bằng danh sách đã báo bên dưới.
      // Dự án nạp hàng loạt (details.dangThe) là việc nội bộ → không email, chỉ hiện ở Admin → Tổng quan
      admin.from("projects").select("id,name").eq("status", "pending").is("details->>dangThe", null).gte("updated_at", tu).lt("updated_at", den),
      admin.from("project_poster_requests").select("id,company_name,project_name").gte("created_at", tu).lt("created_at", den),
      admin.from("customer_requests").select("id,ten,dien_thoai,noi_dung").gte("created_at", tu).lt("created_at", den),
      admin.from("listings").select("id").eq("status", "pending").limit(5000),
    ]);
    // MỖI TIN CHỜ DUYỆT BÁO MỘT LẦN (anh 12/11/2026: "thông báo 1 lần, không lặp lại"): nhớ id đã báo ở
    // site_content "bao_viec_da_bao" (chỉ giữ id còn đang chờ). Khách sửa tin đang chờ không báo lại.
    const dangCho = new Set(((tongCho.data ?? []) as { id: string }[]).map((x) => x.id));
    const { data: nho } = await admin.from("site_content").select("data").eq("key", "bao_viec_da_bao").maybeSingle();
    const daBao = new Set<string>(((nho?.data as { ids?: string[] } | null)?.ids ?? []).filter((x) => dangCho.has(x)));
    tinMoi = ((tinCho.data ?? []) as { id: string; title: string | null }[]).filter((t) => !daBao.has(t.id));
    for (const t of tinMoi) daBao.add(t.id);
    idsDaBao = [...daBao];

    const ten = (s: string | null | undefined) => (s ?? "").slice(0, 70) || "(không tiêu đề)";
    const tin = tinMoi;
    if (tin.length)
      khoi.push({
        tieuDe: EMAIL.tinKhachMoi(tin.length, dangCho.size),
        dong: tin.map((t) => `${t.id.slice(0, 8).toUpperCase()} · ${ten(t.title)}`),
        link: "/admin/tin-dang",
        nhanLink: EMAIL.moiDeDuyet,
      });
    // Khách sửa tin đang hiển thị: Admin không kiểm, không báo (chủ dự án 05/11/2026 — Admin chỉ duyệt tin mới)
    const da = (duAn.data ?? []) as { name: string | null }[];
    if (da.length) khoi.push({ tieuDe: kemSo(VIEC.duAnKhach, da.length), dong: da.map((d) => ten(d.name)), link: "/admin/du-an" });
    const hs = (hoSo.data ?? []) as { company_name: string | null; project_name: string | null }[];
    if (hs.length)
      khoi.push({
        tieuDe: kemSo(VIEC.hoSoDuAn, hs.length),
        dong: hs.map((h) => `${ten(h.company_name)}${h.project_name ? ` · ${h.project_name}` : ""}`),
        link: "/admin/du-an",
      });
    const yc = (yeuCau.data ?? []) as { ten: string | null; dien_thoai: string | null; noi_dung: string | null }[];
    if (yc.length)
      khoi.push({
        tieuDe: kemSo(VIEC.yeuCau, yc.length),
        dong: yc.map((y) => `${y.ten || "(không tên)"} · ${y.dien_thoai || "—"} · ${(y.noi_dung ?? "").slice(0, 80)}`),
        link: "/admin/yeu-cau",
      });
    // Tự kiểm tin (src/lib/kiemTin.ts) là việc nội bộ → không email nữa, hiện ở Admin → Tổng quan (chủ dự án 31/10/2026).
  } catch (e) {
    await baoLoi({ noi: "bao-viec-admin", mucDo: "nhe", tomTat: SU_CO.baoViec, chiTiet: String(e) });
    return NextResponse.json({ ok: false, message: String(e) }, { status: 500 });
  }

  if (!khoi.length) return NextResponse.json({ ok: true, guiEmail: false });
  const chuDe = khoi.length === 1 ? khoi[0].tieuDe : EMAIL.nhieuViec(khoi.length);
  const daGui = await baoAdmin(chuDe, khoi);
  if (daGui && idsDaBao && tinMoi.length) await admin.from("site_content").upsert({ key: "bao_viec_da_bao", data: { ids: idsDaBao } });
  return NextResponse.json({ ok: true, guiEmail: daGui, viec: khoi.map((k) => k.tieuDe) });
}
