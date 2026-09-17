import { baoLoi } from "@/lib/baoLoi";
import type { Viec } from "./soViec";

// ════════════════════════════════════════════════════════════════════════════
// CANH SÁU BẢN GHI TÊN MIỀN — MẤT MỘT CÁI LÀ HỎNG NGAY, MÀ KHÔNG AI THẤY
//
// VÌ SAO PHẢI CANH HẰNG NGÀY: sáu bản ghi này nằm ở nhà cung cấp DNS, KHÔNG
// nằm trong mã nguồn. Một cú bấm nhầm bên đó (hoặc lúc chuyển sang Cloudflare
// chép thiếu một dòng) là:
//   · Mất bản ghi A       → CẢ WEB SẬP, khách vào thấy trang lỗi.
//   · Mất bản ghi Resend  → MẤT OTP, khách không đăng nhập và không đăng tin được.
// Web vẫn "chạy bình thường" trong mắt mình cho tới khi có khách gọi điện kêu.
//
// Bản sao đầy đủ sáu bản ghi: docs/DNS-SAO-LUU-17-09-2026.md
// Bản chạy tay trên máy (xem bằng mắt): scripts/kiem-dns.mjs
//
// KHÔNG GÀO OAN: hỏi không được (mạng lỗi, dns.google chặn) thì im, chỉ ghi
// nhật ký. Gào oan vài lần là lần sau lỗi thật cũng không ai đọc.
// ════════════════════════════════════════════════════════════════════════════

type BanGhi = {
  ten: string;
  loai: "A" | "CNAME" | "TXT";
  /** Chuỗi phải có trong câu trả lời. */
  mong: string;
  /** Mất thì mất gì. */
  hauQua: string;
  /** chet = web sập hoặc khách không vào được · nang = sai lệch, chưa chết ngay */
  mucDo: "chet" | "nang";
};

const CAN: BanGhi[] = [
  { ten: "coastalland.vn", loai: "A", mong: "216.198.79.1", hauQua: "Web sập hoàn toàn — khách vào coastalland.vn không ra gì.", mucDo: "chet" },
  { ten: "www.coastalland.vn", loai: "CNAME", mong: "cname.vercel-dns.com", hauQua: "Khách gõ www.coastalland.vn không vào được web.", mucDo: "chet" },
  { ten: "send.coastalland.vn", loai: "CNAME", mong: "send.forge.rmta.net", hauQua: "Mất thư OTP — khách không đăng nhập và không đăng tin được.", mucDo: "chet" },
  { ten: "rsend.coastalland.vn", loai: "CNAME", mong: "rsend.forge.rmta.net", hauQua: "Mất thư OTP — khách không đăng nhập và không đăng tin được.", mucDo: "chet" },
  { ten: "resend._domainkey.coastalland.vn", loai: "TXT", mong: "p=MIGfMA0GCS", hauQua: "Thư của web mất chữ ký, bị Gmail đẩy vào hòm rác.", mucDo: "nang" },
  { ten: "_dmarc.coastalland.vn", loai: "TXT", mong: "v=DMARC1", hauQua: "Mất lớp chống giả mạo thư đứng tên coastalland.vn.", mucDo: "nang" },
];

/** Hỏi DNS công khai. Trả về null khi KHÔNG HỎI ĐƯỢC (khác hẳn với "không có bản ghi"). */
async function hoi(ten: string, loai: string): Promise<string[] | null> {
  try {
    const r = await fetch(`https://dns.google/resolve?name=${ten}&type=${loai}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as { Answer?: { data: string }[] };
    return (j.Answer ?? []).map((x) => x.data);
  } catch {
    return null;
  }
}

export const viecCanhDns: Viec = {
  ma: "canh-dns",
  ten: "Canh 6 bản ghi tên miền",
  hauQua: "Không ai canh thì mất bản ghi A (web sập) hoặc bản ghi Resend (mất OTP) mà chỉ biết khi khách kêu.",

  async chay() {
    const sai: BanGhi[] = [];
    let khongHoiDuoc = 0;

    for (const c of CAN) {
      const kq = await hoi(c.ten, c.loai);
      if (kq === null) {
        khongHoiDuoc++;
        continue;
      }
      if (!kq.some((x) => x.replace(/"/g, "").includes(c.mong))) sai.push(c);
    }

    if (sai.length > 0) {
      const nang = sai.some((c) => c.mucDo === "chet");
      await baoLoi({
        noi: "canh-dns",
        mucDo: nang ? "chet" : "nang",
        tomTat: `${sai.length} bản ghi tên miền SAI hoặc BIẾN MẤT`,
        chiTiet: sai.map((c) => `${c.ten} (${c.loai}) — cần có "${c.mong}"`).join(" · "),
        hauQua: sai.map((c) => c.hauQua).join(" "),
        canLam:
          "Mở docs/DNS-SAO-LUU-17-09-2026.md đối chiếu rồi khai lại đúng bản ghi bên nhà cung cấp DNS " +
          "(PA Vietnam access.pavietnam.vn, hoặc Cloudflare nếu đã chuyển).",
        // Mỗi ngày một cảnh báo riêng — ngày nào còn sai là ngày đó còn thấy.
        khoa: `canh-dns:${new Date().toISOString().slice(0, 10)}`,
      });
    }

    return {
      tomTat:
        sai.length > 0
          ? `SAI ${sai.length}/${CAN.length} bản ghi: ${sai.map((c) => c.ten).join(", ")}`
          : khongHoiDuoc > 0
            ? `Đủ ${CAN.length - khongHoiDuoc} bản ghi, ${khongHoiDuoc} cái chưa hỏi được`
            : `Đủ cả ${CAN.length} bản ghi`,
      soLieu: { sai: sai.length, khongHoiDuoc },
    };
  },
};
