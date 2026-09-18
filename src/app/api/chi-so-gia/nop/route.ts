import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { docBangChiSo, type ChiSoGiaData, type ChiSoKhuVuc } from "@/lib/chiSoGia";
import { chuanTen } from "@/lib/locations";
import { tachBangCsv } from "@/lib/xuatCsv";
import { docXlsx } from "@/lib/docXlsx";

// ════════════════════════════════════════════════════════════════════════════
// NHẬN SỐ LIỆU LỊCH SỬ GIÁ TỪ NGƯỜI LÀM DỮ LIỆU — TỰ KIỂM, TỰ GHI.
//
// Trước đây mỗi lần cowork gửi tệp thì chủ dự án phải tự mở admin, tải lên, bấm
// Lưu. Làm mỗi ngày trong nhiều tuần thì đó là việc chắc chắn sẽ bị bỏ quên, mà
// bỏ quên một ngày là số của ngày đó không lên web.
//
// Route này nhận thẳng tệp: kiểm xong sạch thì GHI LUÔN, không ai phải bấm.
//
// AN TOÀN — ba lớp, vì đây là cửa ghi thẳng vào thứ khách nhìn thấy:
//   1. Phải có mã nộp (MA_NOP_SO_LIEU ở Vercel). Không có mã thì không vào được.
//   2. Bộ kiểm của chính trang admin (docBangChiSo): thiếu cột, sai kỳ, giá bậy
//      là chặn từng dòng.
//   3. Kiểm thêm ở đây: giá nhảy quá gấp đôi hoặc rơi quá nửa so với kỳ liền
//      trước trong cùng một dãy thì CHẶN CẢ DÃY đó — gần như luôn là chép nhầm
//      cột hoặc nhầm đơn vị. Thà thiếu một dãy còn hơn vẽ ra một cú gãy không có
//      thật.
//
// GHI ĐÈ THEO DÃY: dãy nào có trong tệp thì thay hẳn dãy đó; dãy cũ không nhắc
// tới thì giữ nguyên. Nhờ vậy cowork gửi từng phần mỗi ngày đều được, và gửi lại
// dãy đã sai để sửa cũng được.
// ════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Quá mức này giữa hai kỳ liền nhau là dấu hiệu chép nhầm, không phải thị trường. */
const TRAN_NHAY = 2.0;

const khoaDay = (x: ChiSoKhuVuc) =>
  [chuanTen(x.tinh), chuanTen(x.khuVuc ?? ""), chuanTen(x.loaiHinh ?? ""), x.mucDich ?? "ban"].join("|");

const tenDay = (x: ChiSoKhuVuc) =>
  [x.tinh, x.khuVuc || "cả tỉnh", x.loaiHinh || "mọi loại hình", x.mucDich === "thue" ? "thuê" : "bán"].join(" · ");

/** Dãy có mốc nào nhảy gấp đôi / rơi quá nửa so với mốc liền trước không. */
function nhayBatThuong(x: ChiSoKhuVuc): string | null {
  const moc = [...x.moc].filter((m) => m.giaM2 > 0).sort((a, b) => a.quy.localeCompare(b.quy));
  for (let i = 1; i < moc.length; i++) {
    const truoc = moc[i - 1].giaM2;
    const nay = moc[i].giaM2;
    if (truoc <= 0) continue;
    const ty = nay / truoc;
    if (ty >= TRAN_NHAY || ty <= 1 / TRAN_NHAY) {
      return `${moc[i - 1].quy} → ${moc[i].quy} đổi ${Math.round((ty - 1) * 100)}%`;
    }
  }
  return null;
}

export async function POST(req: Request) {
  const maDung = process.env.MA_NOP_SO_LIEU;
  if (!maDung) {
    return NextResponse.json(
      { ok: false, loi: "Cửa nộp chưa mở. Quản trị cần đặt MA_NOP_SO_LIEU trong Vercel." },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  const ma = String(form?.get("ma") ?? "");
  const tep = form?.get("tep");
  if (ma !== maDung) return NextResponse.json({ ok: false, loi: "Mã nộp không đúng." }, { status: 401 });
  if (!(tep instanceof File)) return NextResponse.json({ ok: false, loi: "Chưa chọn tệp." }, { status: 400 });

  // ── Đọc tệp: nhận cả .xlsx lẫn .csv, y như trang admin ────────────────────
  let bang: string[][];
  try {
    bang = /\.xlsx$/i.test(tep.name)
      ? await docXlsx(await tep.arrayBuffer())
      : tachBangCsv(new TextDecoder().decode(await tep.arrayBuffer()));
  } catch (e) {
    return NextResponse.json(
      { ok: false, loi: `Không đọc được tệp: ${e instanceof Error ? e.message : "tệp hỏng"}` },
      { status: 400 },
    );
  }

  const { items, loi } = docBangChiSo(bang);
  if (!items.length) {
    return NextResponse.json(
      { ok: false, loi: "Tệp không có dãy nào dùng được.", dongLoi: loi.slice(0, 20) },
      { status: 400 },
    );
  }

  // ── Lớp kiểm thứ ba: chặn dãy có bước nhảy vô lý ──────────────────────────
  const nhan: ChiSoKhuVuc[] = [];
  const chan: { day: string; ly: string }[] = [];
  for (const x of items) {
    const batThuong = nhayBatThuong(x);
    if (batThuong) chan.push({ day: tenDay(x), ly: batThuong });
    else nhan.push(x);
  }
  if (!nhan.length) {
    return NextResponse.json({ ok: false, loi: "Mọi dãy đều có bước nhảy bất thường.", chan }, { status: 400 });
  }

  // ── Ghi đè theo dãy, giữ nguyên dãy cũ không nhắc tới ─────────────────────
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ ok: false, loi: "Máy chủ thiếu khoá ghi." }, { status: 503 });

  const { data: cu } = await admin.from("site_content").select("data").eq("key", "chi_so_gia").limit(1);
  const dangCo = ((cu?.[0]?.data as ChiSoGiaData | undefined)?.items ?? []) as ChiSoKhuVuc[];

  const gom = new Map<string, ChiSoKhuVuc>();
  for (const x of dangCo) gom.set(khoaDay(x), x);
  for (const x of nhan) gom.set(khoaDay(x), x);
  const tatCa = [...gom.values()];

  const { error } = await admin
    .from("site_content")
    .upsert({ key: "chi_so_gia", data: { items: tatCa } as ChiSoGiaData });
  if (error) return NextResponse.json({ ok: false, loi: `Không ghi được: ${error.message}` }, { status: 500 });

  // XOÁ CACHE NGAY. Nội dung web được cache theo thẻ "noi-dung" (revalidate 300s);
  // ghi xong mà không xoá thì số mới phải nằm chờ tới năm phút mới hiện ra —
  // người nộp mở trang kiểm, thấy y như cũ, tưởng nộp hỏng rồi nộp lại.
  revalidateTag("noi-dung", "max");

  const soMoc = nhan.reduce((s, x) => s + x.moc.filter((m) => m.giaM2 > 0).length, 0);
  const tomTat = {
    ok: true as const,
    nhan: nhan.length,
    moc: soMoc,
    tongDay: tatCa.length,
    chan,
    dongLoi: loi.slice(0, 20),
    day: nhan.map(tenDay),
  };

  // Báo cho chủ dự án, nhưng KHÔNG để lỗi email làm hỏng lần nộp đã ghi xong.
  void baoChoChu(tomTat, tep.name).catch(() => {});

  return NextResponse.json(tomTat);
}

async function baoChoChu(t: { nhan: number; moc: number; tongDay: number; chan: { day: string; ly: string }[] }, tenTep: string) {
  const key = process.env.RESEND_API_KEY;
  const nhan = (process.env.ADMIN_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!key || !nhan.length) return;

  const canhBao = t.chan.length
    ? `<p style="margin:16px 0 0;color:#b45309;font-size:14px">Chặn ${t.chan.length} dãy vì giá nhảy bất thường:<br>${t.chan
        .map((c) => `${c.day} — ${c.ly}`)
        .join("<br>")}</p>`
    : "";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || "COASTAL LAND <onboarding@resend.dev>",
      to: nhan,
      subject: `Đã nhận số liệu giá: ${t.nhan} dãy`,
      html: `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#1d1d1f">
        <p style="margin:0;font-size:15px">Tệp <b>${tenTep}</b> đã được nạp lên website.</p>
        <p style="margin:12px 0 0;font-size:15px">Nhận <b>${t.nhan}</b> dãy, <b>${t.moc}</b> mốc giá. Kho hiện có <b>${t.tongDay}</b> dãy.</p>
        ${canhBao}
        <p style="margin:20px 0 0;color:#6e6e73;font-size:13px">Xem và sửa tại /admin/chi-so-gia</p>
      </div>`,
    }),
  });
}
